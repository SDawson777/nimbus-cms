import type { Request, Response, NextFunction } from "express";

type AppError = {
  status?: number;
  code?: string;
  message?: string;
  details?: unknown;
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const isValidation =
    typeof err === "object" && err !== null && (err as any).name === "ZodError";
  if (isValidation) {
    const zerr = err as any;
    return res
      .status(400)
      .json({ error: "VALIDATION_ERROR", details: zerr.issues ?? zerr });
  }
  const e = (err as AppError) || {};
  const status = e.status && e.status >= 400 && e.status < 600 ? e.status : 500;
  const code = e.code || (status === 500 ? "INTERNAL_SERVER_ERROR" : "ERROR");
  const message =
    status === 500 ? "Something went wrong" : e.message || "Error";
  return res.status(status).json({ error: code, message, details: e.details });
}
