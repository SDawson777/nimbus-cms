export const TEST_CSRF_TOKEN = "test-csrf-token";

const ADMIN_COOKIE_HEADERS = (token: string) => ({
  cookie: [`admin_token=${token}`, `admin_csrf=${TEST_CSRF_TOKEN}`],
  csrf: TEST_CSRF_TOKEN,
});

function applyAdminHeaders(test: any, token: string) {
  const headers = ADMIN_COOKIE_HEADERS(token);
  return test.set("Cookie", headers.cookie).set("X-CSRF-Token", headers.csrf);
}

export function withAdminCookies(agent: any, token: string) {
  if (typeof agent?.set === "function") {
    return applyAdminHeaders(agent, token);
  }

  const methods = ["get", "post", "put", "patch", "delete"] as const;
  const wrapped: any = {};
  for (const method of methods) {
    wrapped[method] = (...args: any[]) =>
      applyAdminHeaders(agent[method](...args), token);
  }
  return wrapped;
}
