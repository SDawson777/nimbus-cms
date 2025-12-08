import cors from "cors";
import { CSRF_HEADER } from "./requireCsrfToken";

const allowedOrigins = [
  process.env.CORS_ORIGIN_ADMIN,
  process.env.CORS_ORIGIN_MOBILE,
].filter(Boolean) as string[];

export const corsOptions = {
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin) {
      return callback(null, true);
    }
    const appEnv = process.env.APP_ENV || "";
    if (appEnv === "preview") {
      return callback(null, true);
    }
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error("Blocked by CORS:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", CSRF_HEADER],
};

// Backward-compatible export used previously by index.ts
export const nimbusCors = cors(corsOptions);
