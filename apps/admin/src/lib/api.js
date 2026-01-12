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

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
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
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  const signal = options.signal;

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

  try {
    const url = buildUrl(path);
    const response = await fetch(url, {
      ...options,
      method,
      headers,
      signal,
      credentials: options.credentials || "include",
    });

    if (response.status === 401) {
      emitApiError({ type: "unauthorized", status: 401, path: url });
      // Never redirect during a login attempt; the caller needs the response.
      if (!url.includes("/admin/login")) {
        redirectToLogin();
      }
    } else if (response.status === 403) {
      emitApiError({ type: "forbidden", status: 403, path: url });
    } else if (response.status >= 500) {
      emitApiError({
        type: "server-error",
        status: response.status,
        path: url,
      });
    }

    return response;
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    emitApiError({
      type: "network-error",
      status: 0,
      path: buildUrl(path),
      error: err,
    });
    throw err;
  }
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
