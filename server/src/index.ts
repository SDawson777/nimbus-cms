import express from "express";
// CORS is configured via corsOptions below
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { logger } from "./lib/logger";
import adminAuthRouter from "./routes/adminAuth";
import adminUsersRouter from "./routes/adminUsers";
import { requireAdmin } from "./middleware/adminAuth";
import {
  requireCsrfToken,
  ensureCsrfCookie,
} from "./middleware/requireCsrfToken";
import { requestLogger } from "./middleware/requestLogger";
import { swaggerSpec } from "./lib/swagger";
import { corsOptions } from "./middleware/cors";

import { contentRouter } from "./routes/content";
import { personalizationRouter } from "./routes/personalization";
import { statusRouter } from "./routes/status";
import contentWebhookRoutes from "./routes/contentWebhookRoutes";
import { adminRouter } from "./routes/admin";
import adminLoginPage from "./routes/adminLoginPage";
import adminLogoutRouter from "./routes/adminLogout";
import adminSessionInfoRouter from "./routes/adminSessionInfo";
import analyticsRouter from "./routes/analytics";
import aiRouter from "./routes/ai";
import proxyRouter from "./routes/proxy";
import heatmapRouter from "./routes/heatmap";
import undoRouter from "./routes/undo";
import { metricsHandler } from "./metrics";
import { startComplianceScheduler } from "./jobs/complianceSnapshotJob";
import { seedControlPlane } from "./seed";
import { APP_ENV, PORT } from "./config/env";
import validateEnv from "./middleware/validateEnv";
import errorHandler from "./middleware/errorHandler";

// Centralized environment validation (throws in production on fatal misconfig)
try {
  validateEnv();
} catch (err) {
  logger.error("env.validation.failed", err as any);
  // Rethrow to stop the bootstrap when env is invalid in production
  throw err;
}

const app = express();
app.use(cors(corsOptions));
// Trust proxy headers when running behind Railway/Reverse proxies
app.set("trust proxy", 1);
// --- Healthcheck endpoint (must succeed even if DB/Sanity fail) ---
app.get("/api/v1/status", (_req, res) => {
  res.status(200).json({ ok: true, env: process.env.APP_ENV || "unknown" });
});
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
const globalRateLimitWindowMs = (() => {
  const raw = process.env.GLOBAL_RATE_LIMIT_WINDOW_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 15 * 60 * 1000;
})();
const globalRateLimitMax = (() => {
  const raw = process.env.GLOBAL_RATE_LIMIT_MAX;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 100;
})();
// Allow disabling the global limiter by setting GLOBAL_RATE_LIMIT_MAX=0
// (useful for E2E/CI where asset fan-out can exceed default thresholds).
if (globalRateLimitMax > 0) {
  app.use(
    rateLimit({
      windowMs: globalRateLimitWindowMs,
      max: globalRateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
}
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms"),
);
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

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
// Note: keep the custom landing HTML handler above; do not override it with
// a static index file handler. Static assets will still be served from
// `staticDir`.

// Serve a lightweight login page for preview/dev
app.use("/", adminLoginPage);
// Auth helpers: logout + session info
app.use("/", adminLogoutRouter);
app.use("/", adminSessionInfoRouter);

// Admin auth routes (login/logout)
app.use("/admin", adminAuthRouter);
// Also expose admin auth endpoints under the Nimbus API namespace so frontends
// that prefix requests with the `VITE_NIMBUS_API_URL` (e.g. `/api/v1/nimbus`)
// continue to work when they call `/api/v1/nimbus/admin/login` or
// `/api/v1/nimbus/admin/me`.
app.use("/api/v1/nimbus/admin", adminAuthRouter);
// Serve admin static pages (login and dashboard)
// The built admin `index.html` is copied into `static/` root so assets
// resolve at `/assets/*`. Use the root index.html as the SPA entrypoint.
const adminIndex = path.join(staticDir, "index.html");
// Use a route pattern that is compatible with path-to-regexp: use a named
// parameter with a wildcard to capture any admin subpath.
// Serve SPA index for base admin route and any nested admin paths
app.get("/admin", (_req, res) => res.sendFile(adminIndex));
app.get(/^\/admin\/.*$/, (_req, res) => res.sendFile(adminIndex));

// Also serve the SPA index for legacy top-level admin routes
app.get("/login", (_req, res) => res.sendFile(adminIndex));
app.get("/dashboard", (_req, res) => res.sendFile(adminIndex));
app.get("/settings", (_req, res) => res.sendFile(adminIndex));
// Support additional SPA routes that use top-level paths.
// Note: some of these paths overlap with API routers (e.g. /analytics, /personalization).
// We only serve HTML for GET navigations; API calls use non-GET methods and/or subpaths.
app.get(
  [
    "/admins",
    "/products",
    "/articles",
    "/faqs",
    "/deals",
    "/compliance",
    "/legal",
    "/analytics",
    "/analytics/settings",
    "/heatmap",
    "/undo",
    "/theme",
    "/personalization",
  ],
  (_req, res) => res.sendFile(adminIndex),
);
app.get("/admin/dashboard", requireAdmin, (_req, res) =>
  res.sendFile(path.join(staticDir, "admin", "dashboard.html")),
);
// All admin routes are handled by the SPA entrypoint; do not attempt to
// serve separate dashboard/settings HTML files (the SPA renders these).

// content routes (existing + new)
// Mount content routes for legacy API consumers
app.use("/api/v1/content", contentRouter);
// Mount content routes for Nimbus namespace
app.use("/api/v1/nimbus/content", contentRouter);
// Mount content routes for mobile and external consumers (mobile contract)
app.use("/content", contentRouter);

// personalization public endpoints
app.use("/personalization", personalizationRouter);

// Proxy endpoints for server-side API calls that should not expose tokens to clients
app.use("/api/v1/nimbus/proxy", proxyRouter);
// Static heatmap generation endpoint (server-side rendered SVG)
app.use("/api/v1/nimbus/heatmap", heatmapRouter);

// Server-persisted undo/redo events (admin-only)
app.use(
  "/api/v1/nimbus/undo",
  requireAdmin,
  ensureCsrfCookie,
  requireCsrfToken,
  undoRouter,
);

// Prometheus metrics endpoint
app.get("/metrics", metricsHandler());

// Analytics endpoint (collect events)
app.use("/analytics", analyticsRouter);

// AI chat endpoint (protected by RBAC)
app.use("/api/v1/nimbus/ai", aiRouter);

// status routes (legacy and a simple /status alias)
app.use("/api/v1/status", statusRouter);
app.use("/status", statusRouter);
app.use(
  "/api/v1/content/webhook",
  express.json({ type: "*/*" }),
  contentWebhookRoutes,
);
// admin routes (products used by mobile) - protect all API admin routes with requireAdmin
app.use(
  "/api/admin",
  requireAdmin,
  ensureCsrfCookie,
  requireCsrfToken,
  adminRouter,
);

// Admin users management (CRUD) - protected endpoints
app.use(
  "/api/admin/users",
  requireAdmin,
  ensureCsrfCookie,
  requireCsrfToken,
  adminUsersRouter,
);

// Also mount the admin API under the Nimbus namespace to support frontends
// that build paths like `${API_BASE}/api/admin/...` (where `API_BASE` may be
// `/api/v1/nimbus`). This provides backward-compatible routing for those
// callers at `/api/v1/nimbus/api/admin/...`.
app.use(
  "/api/v1/nimbus/api/admin",
  requireAdmin,
  ensureCsrfCookie,
  requireCsrfToken,
  adminRouter,
);

// Global error handler - must be mounted after all routes
app.use(errorHandler);

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

export async function startServer() {
  const port = Number(process.env.PORT) || 8080;

  app.listen(port, "0.0.0.0", () => {
    logger.info("server.started", { port, appEnv: APP_ENV });
  });

  try {
    await seedControlPlane();
  } catch (err) {
    logger.warn(
      "seedControlPlane failed; continuing server runtime",
      err as any,
    );
  }
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error("failed to start server", err);
  });
}

export default app;
