import dotenv from "dotenv";
import express from "express";
import { nimbusCors } from "./middleware/cors";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { logger } from "./lib/logger";
import adminAuthRouter from "./routes/adminAuth";
import { requireAdmin } from "./middleware/adminAuth";
import {
  requireCsrfToken,
  ensureCsrfCookie,
} from "./middleware/requireCsrfToken";
import { requestLogger } from "./middleware/requestLogger";
import { swaggerSpec } from "./lib/swagger";

import { contentRouter } from "./routes/content";
import { personalizationRouter } from "./routes/personalization";
import { statusRouter } from "./routes/status";
import { adminRouter } from "./routes/admin";
import analyticsRouter from "./routes/analytics";
import aiRouter from "./routes/ai";
import { startComplianceScheduler } from "./jobs/complianceSnapshotJob";

dotenv.config();

const requiredSecrets = ["JWT_SECRET"] as const;
const missingSecrets = requiredSecrets.filter((key) => !process.env[key]);
if (missingSecrets.length) {
  throw new Error(
    `Missing required environment variable${missingSecrets.length > 1 ? "s" : ""}: ${missingSecrets.join(
      ", ",
    )}`,
  );
}

const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "";
const weakJwtValues = new Set([
  "change_me_in_prod",
  "changeme",
  "secret",
  "placeholder",
  "your_jwt_secret",
]);
if (isProduction) {
  const normalized = jwtSecret.toLowerCase();
  if (jwtSecret.length < 24 || weakJwtValues.has(normalized)) {
    throw new Error(
      "JWT_SECRET must be at least 24 characters and not a placeholder in production",
    );
  }
} else if (
  jwtSecret.length < 16 ||
  weakJwtValues.has(jwtSecret.toLowerCase())
) {
  logger.warn(
    "JWT_SECRET is weak; set a longer secret before deploying to production",
  );
}

const app = express();
// Security middlewares
app.use(
  helmet({
    hsts: process.env.NODE_ENV === "production" ? undefined : false,
  }),
);
if (process.env.NODE_ENV === "production") {
  app.use(helmet.hsts());
}
// Ensure JSON + URL-encoded parsers and capture raw bodies for HMAC validation
const jsonBodyLimit = process.env.JSON_BODY_LIMIT || "4mb";
app.use(
  express.json({
    limit: jsonBodyLimit,
    verify: (req: any, _res, buf) => {
      if (buf && buf.length) {
        req.rawBody = Buffer.from(buf);
      }
    },
  }),
);
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms"),
);
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.use(nimbusCors);

// Parse cookies (used by admin auth)
app.use(cookieParser());

// Mount OpenAPI/Swagger documentation at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve a small static landing page for human visitors / buyers
app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res
    .status(200)
    .send(
      `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Nimbus CMS API</title><style>:root{--primary:#3F7AFC}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;color:#111827;line-height:1.5}.chip{display:inline-block;padding:2px 8px;border-radius:999px;background:#DBEAFE;color:#1E40AF;font-size:12px;margin-left:8px}.card{background:#fff;border:1px solid #E5E7EB;border-radius:8px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,0.04);max-width:720px}a{color:var(--primary);text-decoration:none}a:hover{text-decoration:underline}ul{padding-left:18px}code{background:#F3F4F6;padding:2px 6px;border-radius:4px}</style></head><body><div class="card"><h1 style="margin-top:0">Nimbus CMS API <span class="chip">online</span></h1><p>Status: <strong>OK</strong></p><ul><li>Time: ${new Date().toISOString()}</li><li>Environment: ${process.env.NODE_ENV || "development"}</li></ul><p>Quick links:</p><ul><li><a href="/status">/status</a></li><li><a href="/api/v1/status">/api/v1/status</a></li><li><a href="/content">/content</a> (public content routes)</li><li><a href="/docs">/docs</a> (OpenAPI documentation)</li></ul><p>Admin API is available under <code>/api/admin</code> (requires auth & CSRF).</p></div></body></html>`,
    );
});
const staticDir = path.join(__dirname, "..", "static");
app.use(express.static(staticDir));
app.get("/", (_req, res) => res.sendFile(path.join(staticDir, "index.html")));

// Admin auth routes (login/logout)
app.use("/admin", adminAuthRouter);
// Serve admin static pages (login and dashboard)
app.get("/admin", (_req, res) =>
  res.sendFile(path.join(staticDir, "admin", "login.html")),
);
app.get("/admin/dashboard", requireAdmin, (_req, res) =>
  res.sendFile(path.join(staticDir, "admin", "dashboard.html")),
);
app.get("/admin/settings", requireAdmin, (_req, res) =>
  res.sendFile(path.join(staticDir, "admin", "settings.html")),
);

// content routes (existing + new)
// Mount content routes for legacy API consumers
app.use("/api/v1/content", contentRouter);
// Mount content routes for Nimbus namespace
app.use("/api/v1/nimbus/content", contentRouter);
// Mount content routes for mobile and external consumers (mobile contract)
app.use("/content", contentRouter);

// personalization public endpoints
app.use("/personalization", personalizationRouter);

// Analytics endpoint (collect events)
app.use("/analytics", analyticsRouter);

// AI chat endpoint (protected by RBAC)
app.use("/api/v1/nimbus/ai", aiRouter);

// status routes (legacy and a simple /status alias)
app.use("/api/v1/status", statusRouter);
app.use("/status", statusRouter);
// admin routes (products used by mobile) - protect all API admin routes with requireAdmin
app.use(
  "/api/admin",
  requireAdmin,
  ensureCsrfCookie,
  requireCsrfToken,
  adminRouter,
);
// Support the legacy /api/v1/nimbus base URL expected by the admin SPA
app.use(
  "/api/v1/nimbus/admin",
  requireAdmin,
  ensureCsrfCookie,
  requireCsrfToken,
  adminRouter,
);

// Start compliance snapshot scheduler only when explicitly enabled (avoid running during tests)
if (process.env.ENABLE_COMPLIANCE_SCHEDULER === "true") {
  try {
    const instanceId =
      process.env.INSTANCE_ID || process.env.HOSTNAME || "local";
    logger.info(
      "Starting compliance scheduler (ensure only one instance has ENABLE_COMPLIANCE_SCHEDULER=true)",
      {
        instanceId,
      },
    );
    startComplianceScheduler();
  } catch (e) {
    logger.error("failed to start compliance scheduler", e);
  }
}

export default app;
