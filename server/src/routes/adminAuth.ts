import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import { loadAdmins, findAdmin, getEnvAdmin, AdminUser } from "../lib/admins";
import { requireAdmin } from "../middleware/adminAuth";
import { z } from "zod";

const router = Router();
const COOKIE_NAME = "admin_token";
const CSRF_COOKIE = "admin_csrf";
const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

// Allow overriding cookie SameSite behavior via env var when needed for cross-site
// deployments (example: admin app on Vercel calling API on Railway). Modern
// browsers require `SameSite=None` + `Secure` to accept cross-site cookies.
const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE ||
  (isProduction ? "none" : "lax")) as "lax" | "strict" | "none";

const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction || COOKIE_SAMESITE === "none",
  sameSite: COOKIE_SAMESITE,
  path: "/",
};

const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction || COOKIE_SAMESITE === "none",
  sameSite: COOKIE_SAMESITE,
  path: "/",
};

const loginBodySchema = z.object({
  brand: z.string().trim().min(1).optional(),
  dispensary: z.string().trim().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(1),
});

router.use(cookieParser());

// Basic rate limiter for admin login to mitigate brute-force in-memory.
// For production, replace with Redis-backed store (connect-redis) and per-IP/user throttling.
const loginLimiter = isProduction
  ? rateLimit({
      windowMs: Number(process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS || 60 * 1000),
      max: Number(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX || 8),
      standardHeaders: true,
      legacyHeaders: false,
    })
  : (_req: any, _res: any, next: any) => next();

// POST /admin/login
// body: {brand?: string, dispensary?: string, email, password}
router.post("/login", loginLimiter, async (req: any, res) => {
  const parsed = loginBodySchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "INVALID_CREDENTIALS", details: parsed.error.issues });
  }
  const { brand, dispensary, email, password } = parsed.data;
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: "SERVER_MISCONFIGURED" });
  }
  const csrfToken = crypto.randomBytes(32).toString("hex");

  if (!email || !password)
    return res.status(400).json({ error: "MISSING_CREDENTIALS" });

  const cfg = loadAdmins();
  // prefer file-backed config
  if (cfg) {
    const found = findAdmin(brand, dispensary, email);
    if (!found || !found.admin)
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    const admin = found.admin as AdminUser;
    let valid = false;
    if (admin.passwordHash) {
      valid = await bcrypt.compare(password, admin.passwordHash);
    } else {
      valid = false;
    }
    if (!valid) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    const safePayload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      organizationSlug: admin.organizationSlug,
      brandSlug: admin.brandSlug,
      storeSlug: admin.storeSlug,
    };
    const token = jwt.sign(safePayload, jwtSecret, { expiresIn: "4h" });
    res.cookie(COOKIE_NAME, token, {
      ...sessionCookieOptions,
      maxAge: SESSION_MAX_AGE_MS,
    });
    res.cookie(CSRF_COOKIE, csrfToken, {
      ...csrfCookieOptions,
      maxAge: SESSION_MAX_AGE_MS,
    });
    return res.json({ ok: true, csrfToken });
  }

  // fallback to env-based single-admin mode
  const envAdmin = getEnvAdmin();
  if (!envAdmin) return res.status(500).json({ error: "ADMIN_NOT_CONFIGURED" });
  if (email !== envAdmin.email)
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  let valid = false;
  if (envAdmin.passwordHash) {
    valid = await bcrypt.compare(password, envAdmin.passwordHash);
  } else if (process.env.ADMIN_PASSWORD) {
    valid = password === process.env.ADMIN_PASSWORD;
  }
  if (!valid) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  const safePayload = {
    id: envAdmin.id,
    email: envAdmin.email,
    role: envAdmin.role,
    organizationSlug: envAdmin.organizationSlug,
    brandSlug: envAdmin.brandSlug,
    storeSlug: envAdmin.storeSlug,
  };
  const token = jwt.sign(safePayload, jwtSecret, { expiresIn: "4h" });
  res.cookie(COOKIE_NAME, token, {
    ...sessionCookieOptions,
    maxAge: SESSION_MAX_AGE_MS,
  });
  res.cookie(CSRF_COOKIE, csrfToken, {
    ...csrfCookieOptions,
    maxAge: SESSION_MAX_AGE_MS,
  });
  res.json({ ok: true, csrfToken });
});

// Return the current admin (from signed cookie)
router.get("/me", requireAdmin, (req: any, res) => {
  const admin = (req as any).admin || null;
  // ensure passwordHash is never leaked
  if (admin && admin.passwordHash) delete admin.passwordHash;
  // enrich with tenantSlug if present in payload
  const tenantSlug = admin?.organizationSlug || admin?.brandSlug || null;
  res.json({ admin: { ...admin, tenantSlug } });
});

// GET /admin/logout
router.get("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, sessionCookieOptions);
  res.clearCookie(CSRF_COOKIE, csrfCookieOptions);
  // Prefer a redirect when called from a browser link; keep JSON for XHR callers
  if (_req.headers.accept && _req.headers.accept.indexOf("text/html") !== -1) {
    return res.redirect("/admin");
  }
  res.json({ ok: true });
});

export default router;
