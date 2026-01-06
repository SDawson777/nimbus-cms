import * as Sentry from "@sentry/node";
import type { Request } from "express";

let initialized = false;
let shutdownHooksInstalled = false;

async function flushSentry(reason: string) {
  if (!initialized) return;
  try {
    // Give Sentry a moment to ship events before exit.
    await Sentry.flush(Number(process.env.SENTRY_FLUSH_TIMEOUT_MS || 2000));
    // eslint-disable-next-line no-console
    console.log("Sentry flushed", { reason });
  } catch {
    // ignore
  }
}

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    // In dev/preview, it’s easy to think Sentry is “broken” when the DSN simply
    // isn’t present in the env file being loaded.
    if (process.env.NODE_ENV !== "production" && process.env.SENTRY_REQUIRED === "true") {
      // eslint-disable-next-line no-console
      console.warn("Sentry DSN missing (server). Set SENTRY_DSN to capture errors.");
    }
    return;
  }
  if (initialized) return;

  // Enterprise-grade Sentry config for Node.js server
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.APP_ENV || process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE || process.env.APP_VERSION,

    // Enable SDK debug logging when troubleshooting local delivery.
    debug: process.env.SENTRY_DEBUG === "true",

    // Performance monitoring: 10% transaction sample rate
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),

    // Profiling: capture CPU/memory profiles (1% sample rate for profiles)
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || 0.01),

    // Integrations: automatically capture HTTP, DB, and other instrumentation
    integrations: (integrations) => {
      // Include default integrations + keep existing ones
      return integrations;
    },

    // PII scrubbing: remove sensitive data before sending
    beforeSend(event, hint) {
      if (!event) return null;

      // Scrub authorization headers from request context
      if (event.request?.headers) {
        delete event.request.headers["Authorization"];
        delete event.request.headers["authorization"];
        delete event.request.headers["X-Auth-Token"];
        delete event.request.headers["X-CSRF-Token"];
        delete event.request.headers["Cookie"];
      }

      // Scrub environment variables that may contain secrets
      if (event.contexts?.env) {
        const cleaned = { ...event.contexts.env };
        ["DATABASE_URL", "REDIS_URL", "JWT_SECRET", "SANITY_API_TOKEN", "STRIPE_KEY"].forEach(
          (key) => {
            if (key in cleaned) cleaned[key] = "[scrubbed]";
          }
        );
        event.contexts.env = cleaned;
      }

      // Scrub breadcrumb data
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((crumb) => {
          if (crumb.data) {
            const cleaned = { ...crumb.data };
            ["token", "password", "secret", "key", "auth", "token"].forEach((field) => {
              if (field in cleaned) cleaned[field] = "[scrubbed]";
            });
            return { ...crumb, data: cleaned };
          }
          return crumb;
        });
      }

      return event;
    },

    // Allow errors from specific modules only; ignore noise
    denyUrls: [],
    allowUrls: [],
  });

  // Capture uncaught exceptions
  process.on("unhandledRejection", (err) => {
    Sentry.captureException(err);
  });

  if (!shutdownHooksInstalled) {
    shutdownHooksInstalled = true;

    const handleSignal = (signal: string) => {
      // Fire-and-forget flush, then let default termination proceed.
      void flushSentry(signal);
    };

    process.once("SIGINT", () => handleSignal("SIGINT"));
    process.once("SIGTERM", () => handleSignal("SIGTERM"));
    process.once("beforeExit", () => {
      void flushSentry("beforeExit");
    });
  }

  initialized = true;

  // Log Sentry initialization
  // eslint-disable-next-line no-console
  console.log("Sentry initialized (server)", {
    env: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || 0.01),
  });
}

export function captureException(
  err: unknown,
  req?: Request & { requestId?: string },
): string | undefined {
  if (!process.env.SENTRY_DSN) return;
  if (!initialized) initSentry();

  try {
    let eventId: string | undefined;
    Sentry.withScope((scope) => {
      if (req) {
        const requestId = req.requestId || (req.headers?.["x-request-id"] as string) || undefined;
        if (requestId) scope.setTag("requestId", requestId);
        scope.setTag("method", req.method);
        scope.setTag("path", req.path);
        scope.setTag("statusCode", (req as any).statusCode || 500);

        // Capture user info if available (from session/JWT)
        if ((req as any).admin?.email) {
          scope.setUser({ email: (req as any).admin.email });
        }
      }
      scope.setLevel("error");
      eventId = Sentry.captureException(err);
    });

    return eventId;
  } catch {
    // ignore (never break request handling)
  }
}

/**
 * Capture a message (non-error) event to Sentry for structured logging.
 * Useful for audit trails, deployment markers, etc.
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  if (!process.env.SENTRY_DSN) return;
  if (!initialized) initSentry();

  try {
    Sentry.captureMessage(message, level);
  } catch {
    // ignore
  }
}
