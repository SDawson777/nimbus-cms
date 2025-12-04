import axios from "axios";
import { safeJson } from "./safeJson";
import { getCsrfToken } from "./csrf";

// Respect the provided base URL without stripping trailing API segments; only remove trailing slashes.
const API_BASE = (import.meta.env.VITE_NIMBUS_API_URL || "")
  .trim()
  .replace(/\/$/, "");

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function buildUrl(path = "") {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  if (!API_BASE) return normalized || "/";
  return `${API_BASE}${normalized}`;
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

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

  const response = await fetch(buildUrl(path), {
    ...options,
    method,
    headers,
    credentials: options.credentials || "include",
  });

  return response;
}

export async function apiJson(path, options = {}, fallback = null) {
  const res = await apiFetch(path, options);
  const data = await safeJson(res, fallback);
  return { ok: res.ok, status: res.status, data, response: res };
}

export function apiBaseUrl() {
  return API_BASE || "";
}
