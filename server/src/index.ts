import express from "express";
// CORS is configured via corsOptions below
import cors from "cors";
import fs from "fs";
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
import datasetsRouter from "./routes/datasets";
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
import analyticsDataRouter from "./routes/analytics";
import aiRouter from "./routes/ai";
import { mobileContentRouter } from "./routes/mobileContent";
import { mobileSanityRouter } from "./routes/mobileSanityContent";
import { webhooksRouter } from "./routes/webhooks";
import proxyRouter from "./routes/proxy";
import heatmapRouter from "./routes/heatmap";
import undoRouter from "./routes/undo";
import quizRouter from "./routes/quizRoutes";
import { productsRouter } from "./routes/products";
import { storesRouter } from "./routes/stores";
import { storesV1Router } from "./routes/v1/stores";
import { recommendationsRouter } from "./routes/recommendations";
import { userRewardsRouter } from "./routes/userRewards";
import { metricsHandler, metricsMiddleware } from "./metrics";
import { startComplianceScheduler } from "./jobs/complianceSnapshotJob";
import { seedControlPlane } from "./seed";
import { APP_ENV, PORT } from "./config/env";
import validateEnv from "./middleware/validateEnv";
import errorHandler from "./middleware/errorHandler";
import { initSentry } from "./lib/sentry";
import getPrisma from "./lib/prisma";
import { fetchCMS } from "./lib/cms";

// Centralized environment validation (throws in production on fatal misconfig)
try {
  validateEnv();
} catch (err) {
  logger.error("env.validation.failed", err as any);
  // Rethrow to stop the bootstrap when env is invalid in production
  throw err;
}

// Optional: capture server-side exceptions to Sentry if configured.
initSentry();

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
  if (Number.isFinite(parsed)) return parsed;
  // In non-production, allow higher burst to tolerate local SPA asset fan-out
  // and E2E test parallelism without spurious 429s.
  return process.env.NODE_ENV === "production" ? 100 : 1000;
})();
// Global rate limiting is useful in production, but it causes flaky local E2E
// runs due to SPA asset fan-out + parallel test workers.
// Keep it production-only; production can further tune/disable via env.
if (process.env.NODE_ENV === "production" && globalRateLimitMax > 0) {
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

// Enterprise: Prometheus metrics collection middleware
app.use(metricsMiddleware());

// Parse cookies (used by admin auth)
app.use(cookieParser());

// Mount OpenAPI/Swagger documentation at /docs
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve a small static landing page for human visitors / buyers
app.get("/healthz", (_req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    version: "mobile-api-v1.0.0",
    commit: "a28207c"
  });
});

// Debug endpoint to check route registration and file paths
app.get("/debug/routes", (_req, res) => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const staticDir = path.join(__dirname, "..", "static");
  const adminSpaDistDir = path.join(repoRoot, "apps", "admin", "dist");
  const adminSpaIndex = path.join(adminSpaDistDir, "index.html");
  const staticAdminIndex = path.join(staticDir, "index.html");
  
  res.status(200).json({
    paths: {
      __dirname,
      repoRoot,
      staticDir,
      adminSpaDistDir,
      adminSpaIndex,
      staticAdminIndex,
    },
    exists: {
      staticDir: fs.existsSync(staticDir),
      adminSpaIndex: fs.existsSync(adminSpaIndex),
      staticAdminIndex: fs.existsSync(staticAdminIndex),
    },
    staticDirContents: fs.existsSync(staticDir) ? fs.readdirSync(staticDir).slice(0, 20) : [],
  });
});

// Readiness endpoint (DB + Sanity).
// - Used by uptime monitors and deploy platforms.
// - Returns 200 only when the service can talk to core dependencies.
app.get("/ready", async (_req, res) => {
  const startedAt = Date.now();
  const checks: Record<
    string,
    { ok: boolean; ms: number; error?: string }
  > = {
    db: { ok: false, ms: 0 },
    sanity: { ok: false, ms: 0 },
    redis: { ok: false, ms: 0 },
  };

  // DB check
  {
    const t0 = Date.now();
    try {
      const prisma = getPrisma();
      // Lightweight liveness query
      await prisma.$queryRaw`SELECT 1`;
      checks.db = { ok: true, ms: Date.now() - t0 };
    } catch (e: any) {
      checks.db = {
        ok: false,
        ms: Date.now() - t0,
        error: e?.message ? String(e.message) : "db check failed",
      };
    }
  }

  // Sanity check
  {
    const t0 = Date.now();
    try {
      // Minimal query that does not assume specific schemas.
      await fetchCMS<number>("count(*[])", {});
      checks.sanity = { ok: true, ms: Date.now() - t0 };
    } catch (e: any) {
      checks.sanity = {
        ok: false,
        ms: Date.now() - t0,
        error: e?.message ? String(e.message) : "sanity check failed",
      };
    }
  }

  // Redis check (optional - only if REDIS_URL is configured)
  {
    const t0 = Date.now();
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      checks.redis = { ok: true, ms: 0, error: "not configured (optional)" };
    } else {
      try {
        const IORedis = (await import("ioredis")).default;
        const client = new IORedis(redisUrl, { 
          connectTimeout: 5000,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });
        await client.connect();
        await client.ping();
        await client.quit();
        checks.redis = { ok: true, ms: Date.now() - t0 };
      } catch (e: any) {
        checks.redis = {
          ok: false,
          ms: Date.now() - t0,
          error: e?.message ? String(e.message) : "redis check failed",
        };
      }
    }
  }

  // Redis is optional - only db and sanity are required for "ok"
  const ok = checks.db.ok && checks.sanity.ok;
  const status = ok ? 200 : 503;
  res.status(status).json({ ok, checks, ms: Date.now() - startedAt });
});
app.get("/", (_req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res
    .status(200)
    .send(
      `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Nimbus CMS API</title><style>:root{--primary:#3F7AFC}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px;color:#111827;line-height:1.5}.chip{display:inline-block;padding:2px 8px;border-radius:999px;background:#DBEAFE;color:#1E40AF;font-size:12px;margin-left:8px}.card{background:#fff;border:1px solid #E5E7EB;border-radius:8px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,0.04);max-width:720px}a{color:var(--primary);text-decoration:none}a:hover{text-decoration:underline}ul{padding-left:18px}code{background:#F3F4F6;padding:2px 6px;border-radius:4px}</style></head><body><div class="card"><h1 style="margin-top:0">Nimbus CMS API <span class="chip">online</span></h1><p>Status: <strong>OK</strong></p><ul><li>Time: ${new Date().toISOString()}</li><li>Environment: ${process.env.NODE_ENV || "development"}</li></ul><p>Quick links:</p><ul><li><a href="/status">/status</a></li><li><a href="/api/v1/status">/api/v1/status</a></li><li><a href="/content">/content</a> (public content routes)</li><li><a href="/docs">/docs</a> (OpenAPI documentation)</li></ul><p>Admin API is available under <code>/api/admin</code> (requires auth & CSRF).</p></div></body></html>`,
    );
});

// PUBLIC MOBILE APP ENDPOINTS - Mount BEFORE static files to prevent conflicts
// These must be registered early to avoid being caught by static file handlers
app.use("/products", productsRouter);
app.use("/stores", storesRouter);
app.use("/v1/stores", storesV1Router);
app.use("/recommendations", recommendationsRouter);

// Admin SPA is hosted separately on Vercel, not served from this API server
// Only serve static assets if they exist (for local development)
const staticDir = path.join(__dirname, "..", "static");
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

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
// Datasets API - provides list of available Sanity datasets
app.use("/api/datasets", datasetsRouter);
// Note: Admin SPA is hosted on Vercel, not served from this API server

// All admin routes are handled by the SPA entrypoint; do not attempt to
// serve separate dashboard/settings HTML files (the SPA renders these).

// content routes (existing + new)
// Mount content routes for legacy API consumers
app.use("/api/v1/content", contentRouter);
// Mount content routes for Nimbus namespace
app.use("/api/v1/nimbus/content", contentRouter);
// Mount content routes for mobile and external consumers (mobile contract)
app.use("/content", contentRouter);

// Quiz routes (article-linked quizzes with loyalty rewards)
app.use("/api/v1/content", quizRouter);
app.use("/api/v1/nimbus/content", quizRouter);
app.use("/api/v1", quizRouter);
app.use("/api/v1/nimbus", quizRouter);

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

// Analytics event collection endpoint (existing)
app.use("/analytics", analyticsRouter);

// Analytics data endpoints (new - requires admin)
app.use("/api/v1/nimbus/analytics", requireAdmin, analyticsDataRouter);

// AI chat endpoint (protected by RBAC)
app.use("/api/v1/nimbus/ai", aiRouter);

// Mobile AI endpoint (no auth required)
app.use("/api/ai", aiRouter);

// Mobile content endpoints  
app.use("/mobile/content", mobileContentRouter);

// Mobile Sanity content endpoints (direct Sanity CMS queries - no PostgreSQL)
// Provides articles, FAQ, banners, deals, legal docs, accessibility, awards, etc.
app.use("/mobile/sanity", mobileSanityRouter);

// User rewards and points system
app.use("/api/v1/user/rewards", userRewardsRouter);

// Webhook endpoints for Sanity CMS sync
app.use("/webhooks", webhooksRouter);

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


// DEV-ONLY: Intentionally throw an error for test purposes
if (process.env.NODE_ENV !== "production") {
  app.get("/dev/trigger-error", (_req, _res, next) => {
    // eslint-disable-next-line no-console
    console.warn("[DEV] Triggering intentional error for test");
    next(new Error("Intentional test error from /dev/trigger-error"));
  });
}

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

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION-READY ERROR HANDLERS & GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gracefully shut down the server, closing database connections and active
 * requests before exiting.
 */
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    // Close database connections
    const prisma = getPrisma();
    await prisma.$disconnect();
    logger.info("Database connections closed");
  } catch (err) {
    logger.error("Error closing database connections", err);
  }
  
  // Exit successfully
  process.exit(0);
}

// Handle termination signals (SIGTERM from orchestrators, SIGINT from Ctrl+C)
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error("Unhandled Promise Rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: String(promise),
  });
  
  // In production, log but don't crash on first rejection
  // Let orchestrator handle restart if multiple rejections occur
  if (process.env.NODE_ENV === "production") {
    logger.warn("Continuing after unhandled rejection (production mode)");
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception", {
    message: error.message,
    stack: error.stack,
  });
  
  // Uncaught exceptions are serious - attempt graceful shutdown
  gracefulShutdown("uncaughtException").catch(() => {
    process.exit(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════

export async function startServer() {
  const port = Number(process.env.PORT) || 8080;

  const server = app.listen(port, "0.0.0.0", () => {
    logger.info("server.started", { port, appEnv: APP_ENV });
  });

  // Set server timeout to prevent hanging connections
  server.timeout = 30000; // 30 seconds
  server.keepAliveTimeout = 65000; // 65 seconds (longer than ALB idle timeout)
  server.headersTimeout = 66000; // Slightly longer than keepAliveTimeout

  try {
    await seedControlPlane();
  } catch (err) {
    logger.warn(
      "seedControlPlane failed; continuing server runtime",
      err as any,
    );
  }
  
  return server;
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error("failed to start server", err);
    process.exit(1);
  });
}

export default app;
