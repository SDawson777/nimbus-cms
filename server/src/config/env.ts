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

// In demo/E2E mode, allow running without a real database
export const USE_DEMO_DATA: boolean =
  process.env.USE_DEMO_DATA === "true" || process.env.E2E_MODE === "true";
export const E2E_MODE: boolean = process.env.E2E_MODE === "true";

if (!databaseUrl && !USE_DEMO_DATA) {
  throw new Error("DATABASE_URL is required (or set USE_DEMO_DATA=true for demo mode)");
}
if (!jwtSecret && !USE_DEMO_DATA) {
  throw new Error("JWT_SECRET is required (or set USE_DEMO_DATA=true for demo mode)");
}

export const DATABASE_URL: string = databaseUrl || "file:./demo.db";
export const JWT_SECRET: string = jwtSecret || "demo-secret-for-e2e-tests-only";
