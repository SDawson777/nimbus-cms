import { Router } from "express";

const router = Router();

// JWT-based logout: clear auth + CSRF cookies
router.post("/api/v1/nimbus/auth/admin/logout", (_req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  const COOKIE_NAME = "admin_token";
  const CSRF_COOKIE = "admin_csrf";

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });

  res.clearCookie(CSRF_COOKIE, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });

  return res
    .status(200)
    .json({ status: 200, message: "Logged out successfully" });
});

export default router;
