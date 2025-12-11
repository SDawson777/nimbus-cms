import { randomUUID } from "crypto";
import type { RequestHandler } from "express";
import { logger, type Logger } from "../lib/logger";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: Logger;
    }
  }
}

const headerRequestIdKeys = ["x-request-id", "x-correlation-id"];

export const requestLogger: RequestHandler = (req, res, next) => {
  const headerRequestId = headerRequestIdKeys
    .map((key) => req.header(key))
    .find((value): value is string => Boolean(value));
  const requestId = headerRequestId || randomUUID();
  const start = Date.now();

  const requestLog = logger.withContext({
    requestId,
    method: req.method,
    path: req.path,
  });

  req.requestId = requestId;
  req.log = requestLog;

  requestLog.info("request.start", {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  let completed = false;
  res.on("finish", () => {
    completed = true;
    requestLog.info("request.complete", {
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      contentLength: res.getHeader("content-length"),
    });
  });

  res.on("close", () => {
    if (completed) return;
    requestLog.warn("request.aborted", {
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
};

export default requestLogger;
