import axios from "axios";
import { safeJson } from "./safeJson";
import { getCsrfToken } from "./csrf";

// Respect the provided base URL; prefer canonical `VITE_NIMBUS_API_URL` but fall
// back to legacy `VITE_API_URL` for compatibility. Only remove trailing slashes.
const API_BASE = (
  import.meta.env.VITE_NIMBUS_API_URL ||
  import.meta.env.VITE_API_URL ||
  ""
)
  .trim()
  .replace(/\/$/, "");

export const APP_ENV = (import.meta.env.VITE_APP_ENV || "").trim();

// ═══════════════════════════════════════════════════════════════════════════
// ENTERPRISE: Retry configuration with exponential backoff
// ═══════════════════════════════════════════════════════════════════════════
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 5000,
  retryableStatuses: new Set([408, 429, 500, 502, 503, 504]),
};

// Circuit breaker state for cascading failure protection
const circuitBreaker = {
  failures: 0,
  lastFailure: 0,
  isOpen: false,
  threshold: 5,
  resetTimeMs: 30000,
};

function shouldRetry(status, attempt) {
  if (attempt >= RETRY_CONFIG.maxRetries) return false;
  return RETRY_CONFIG.retryableStatuses.has(status);
}

function getRetryDelay(attempt) {
  const delay = Math.min(
    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 200;
}

function checkCircuitBreaker() {
  if (!circuitBreaker.isOpen) return true;
  const timeSinceFailure = Date.now() - circuitBreaker.lastFailure;
  if (timeSinceFailure > circuitBreaker.resetTimeMs) {
    circuitBreaker.isOpen = false;
    circuitBreaker.failures = 0;
    return true;
  }
  return false;
}

function recordFailure() {
  circuitBreaker.failures++;
  circuitBreaker.lastFailure = Date.now();
  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    circuitBreaker.isOpen = true;
    console.warn("[API] Circuit breaker opened - too many failures");
  }
}

function recordSuccess() {
  circuitBreaker.failures = Math.max(0, circuitBreaker.failures - 1);
}

// Default request timeout (30 seconds)
const DEFAULT_TIMEOUT_MS = 30000;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT_MS,
});
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const apiEventTarget = typeof window !== "undefined" ? new EventTarget() : null;

export function subscribeToApiErrors(listener) {
  if (!apiEventTarget) return () => {};
  const handler = (event) => listener(event.detail);
  apiEventTarget.addEventListener("api-error", handler);
  return () => apiEventTarget.removeEventListener("api-error", handler);
}

function emitApiError(detail) {
  if (!apiEventTarget) return;
  apiEventTarget.dispatchEvent(new CustomEvent("api-error", { detail }));
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  // Don't redirect if already on login page (prevents infinite reload)
  if (window.location.pathname === "/login") return;
  window.location.replace("/login");
}

function buildUrl(path = "") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  // Build a URL relative to the current origin when no API base is provided.
  // Always append tenant query param automatically when present in localStorage.
  let url = API_BASE ? `${API_BASE}${normalized}` : normalized || "/";
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const tenant = localStorage.getItem("nimbus.activeTenant");
      if (tenant) {
        const sep = url.includes("?") ? "&" : "?";
        url = `${url}${sep}tenant=${encodeURIComponent(tenant)}`;
      }
    }
  } catch (e) {
    // ignore localStorage errors (e.g., in some test envs)
  }
  return url;
}

export async function apiFetch(path, options = {}) {
  // Check circuit breaker before attempting request
  if (!checkCircuitBreaker()) {
    const error = new Error("Service temporarily unavailable - please retry shortly");
    error.code = "CIRCUIT_OPEN";
    emitApiError({ type: "circuit-open", status: 503, path: buildUrl(path) });
    throw error;
  }

  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  const signal = options.signal;
  const noRetry = options.noRetry === true;
  const timeout = options.timeout || DEFAULT_TIMEOUT_MS;

  if (!SAFE_METHODS.has(method)) {
    const csrf = getCsrfToken();
    if (csrf && !headers.has("X-CSRF-Token")) headers.set("X-CSRF-Token", csrf);
    if (
      !headers.has("Content-Type") &&
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const url = buildUrl(path);
  let lastError = null;
  let attempt = 0;

  while (attempt <= RETRY_CONFIG.maxRetries) {
    try {
      // Create timeout controller if no signal provided
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const requestSignal = signal || controller.signal;

      const response = await fetch(url, {
        ...options,
        method,
        headers,
        signal: requestSignal,
        credentials: options.credentials || "include",
      });

      clearTimeout(timeoutId);

      // Handle specific status codes
      if (response.status === 401) {
        emitApiError({ type: "unauthorized", status: 401, path: url });
        if (!url.includes("/admin/login")) {
          redirectToLogin();
        }
        return response;
      } else if (response.status === 403) {
        emitApiError({ type: "forbidden", status: 403, path: url });
        return response;
      } else if (response.status >= 500) {
        emitApiError({
          type: "server-error",
          status: response.status,
          path: url,
        });
        
        // Retry on 5xx errors
        if (!noRetry && shouldRetry(response.status, attempt)) {
          attempt++;
          const delay = getRetryDelay(attempt);
          console.warn(`[API] Retrying request (attempt ${attempt}) after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        recordFailure();
        return response;
      }

      // Success - record and return
      recordSuccess();
      return response;
    } catch (err) {
      clearTimeout && clearTimeout();
      
      if (err?.name === "AbortError") {
        // Check if it was a timeout vs manual abort
        if (!signal?.aborted) {
          err.message = "Request timed out";
          err.code = "TIMEOUT";
        }
        throw err;
      }

      lastError = err;

      // Retry on network errors
      if (!noRetry && attempt < RETRY_CONFIG.maxRetries) {
        attempt++;
        const delay = getRetryDelay(attempt);
        console.warn(`[API] Network error, retrying (attempt ${attempt}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      recordFailure();
      emitApiError({
        type: "network-error",
        status: 0,
        path: url,
        error: err,
      });
      throw err;
    }
  }

  // Should not reach here, but safety fallback
  if (lastError) throw lastError;
  throw new Error("Request failed after retries");
}

export async function apiJson(path, options = {}, fallback = null) {
  try {
    const res = await apiFetch(path, options);
    const data = await safeJson(res, fallback);
    const error = res.ok
      ? null
      : data?.error ||
        data?.message ||
        `Request failed (${res.status || "unknown"})`;
    return { ok: res.ok, status: res.status, data, error, response: res };
  } catch (err) {
    const aborted = err?.name === "AbortError";
    return {
      ok: false,
      status: 0,
      data: fallback,
      error: aborted ? "Request aborted" : err?.message || "Network error",
      response: null,
      aborted,
    };
  }
}

export function apiBaseUrl() {
  return API_BASE || "";
}
