// Lightweight CSRF helper for Admin SPA fetch calls
// Uses browser fetch types; in non-DOM contexts this file should be excluded.

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("admin_csrf="));
  if (!match) return null;
  return decodeURIComponent(match.split("=")[1] || "") || null;
}

export function withCsrf(init: RequestInit = {}): RequestInit {
  const token = getCsrfToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", token);
  }
  return {
    ...init,
    headers,
    credentials: init.credentials || "include",
  };
}

export function csrfFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, withCsrf(init));
}
