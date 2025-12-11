import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
export const CSRF_COOKIE = "admin_csrf";
export const CSRF_HEADER = "x-csrf-token";

export function ensureCsrfCookie(req: any, res: Response, next: NextFunction) {
  if (!req.cookies || !req.cookies[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 4 * 60 * 60 * 1000,
      path: "/",
    });
  }
  next();
}

export function requireCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const cookieToken = req.cookies ? req.cookies[CSRF_COOKIE] : undefined;
  const headerToken = req.header(CSRF_HEADER);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "CSRF_MISMATCH" });
  }

  return next();
}

export default requireCsrfToken;
