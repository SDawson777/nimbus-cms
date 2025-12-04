import cors from "cors";
import { logger } from "../lib/logger";
import { CSRF_HEADER } from "./requireCsrfToken";

const allowedOrigins: string[] = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Dynamic enterprise-grade CORS handler
export const nimbusCors = cors({
  origin(
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) {
    // Allow same-origin requests (curl, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn("CORS origin denied", { origin });
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", CSRF_HEADER],
  credentials: true,
});
