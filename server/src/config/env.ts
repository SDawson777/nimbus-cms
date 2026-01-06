import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load env files deterministically regardless of process cwd.
// 1) Repo root `.env` (fallback/shared)
// 2) `server/.env` (server-specific overrides)
const repoRootEnvPath = path.resolve(__dirname, "..", "..", "..", ".env");
const serverEnvPath = path.resolve(__dirname, "..", "..", ".env");
if (fs.existsSync(repoRootEnvPath)) {
  dotenv.config({ path: repoRootEnvPath, override: false });
}
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath, override: true });
}

// Backward-compatible fallback (in case callers rely on cwd-based loading).
dotenv.config();

export type AppEnv = "demo" | "preview" | "prod";

export const APP_ENV: AppEnv = (process.env.APP_ENV as AppEnv) || "preview";
export const PORT: number = Number(process.env.PORT || "8080");
export const SANITY_DATASET_DEFAULT: string =
  process.env.SANITY_DATASET_DEFAULT || "";
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
export const ADMIN_SEED_ENABLED: boolean =
  (process.env.ADMIN_SEED_ENABLED || "false") === "true";
export const DEMO_TENANT_SLUG: string = process.env.DEMO_TENANT_SLUG || "";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}
if (!jwtSecret) {
  throw new Error("JWT_SECRET is required");
}

export const DATABASE_URL: string = databaseUrl;
export const JWT_SECRET: string = jwtSecret;
