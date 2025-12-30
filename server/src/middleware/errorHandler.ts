import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

type AppError = {
  status?: number;
  code?: string;
  message?: string;
  details?: unknown;
};

/**
 * Global error handler
 * - Logs errors with correlation/request id
 * - Returns structured JSON: { ok: boolean, error: { code, message, details }, requestId }
 */
export function errorHandler(
  err: unknown,
  req: Request & { requestId?: string; log?: any },
  res: Response,
  _next: NextFunction,
) {
  const requestId = req.requestId || (req.headers["x-request-id"] as string) || "unknown";
  const log = req.log || logger.withContext({ requestId });

  // Special-case validation libraries (e.g., Zod)
  const isZod = typeof err === "object" && err !== null && (err as any).name === "ZodError";
  if (isZod) {
    const z = err as any;
    log.warn("validation.failure", { requestId, issues: z.issues ?? null });
    return res.status(400).json({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Validation failed", details: z.issues ?? null },
      requestId,
    });
  }

  const e = (err as AppError) || {};
  const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 500;
  const code = e.code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "ERROR");
  const message = status === 500 ? "Internal server error" : e.message || "Error";

  // Log full error with stack for server-side debugging / observability
  if (status >= 500) {
    log.error("unhandled.error", { requestId, error: err instanceof Error ? err.message : String(err), stack: (err as any)?.stack });
  } else {
    log.warn("handled.error", { requestId, code, message });
  }

  return res.status(status).json({
    ok: false,
    error: { code, message, details: e.details ?? undefined },
    requestId,
  });
}

export default errorHandler;
