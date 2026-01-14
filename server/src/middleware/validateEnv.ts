import { APP_ENV } from "../config/env";

export function validateEnv() {
  const isProduction = process.env.NODE_ENV === "production";
  const strict = process.env.STRICT_ENV_VALIDATION === "true";

  // JWT secret validation
  const jwt = process.env.JWT_SECRET || "";
  const weakJwtValues = new Set([
    "change_me_in_prod",
    "changeme",
    "secret",
    "placeholder",
    "your_jwt_secret",
  ]);
  if (isProduction) {
    if (jwt.length < 24 || weakJwtValues.has(jwt.toLowerCase())) {
      const msg = "JWT_SECRET should be at least 24 characters and not a placeholder in production";
      if (strict) {
        throw new Error(msg);
      } else {
        // eslint-disable-next-line no-console
        console.warn(msg);
      }
    }
  } else {
    if (jwt.length < 16 || weakJwtValues.has(jwt.toLowerCase())) {
      // warn in non-prod
      // eslint-disable-next-line no-console
      console.warn("JWT_SECRET is weak; set a longer secret before deploying to production");
    }
  }

  // CORS validation
  const corsList = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const frontendOriginsToCheck = [
    process.env.ADMIN_ORIGIN,
    process.env.STUDIO_ORIGIN,
    process.env.MOBILE_ORIGIN,
    process.env.PREVIEW_ORIGIN,
  ].filter(Boolean) as string[];

  if (isProduction) {
    if (!corsList.length) {
      const msg =
        "CORS_ORIGINS is not configured in production; configure it to restrict allowed origins";
      if (strict) {
        throw new Error(
          "CORS_ORIGINS must be configured in production (comma-separated list of allowed origins)",
        );
      } else {
        // eslint-disable-next-line no-console
        console.warn(msg);
      }
    }

    // Ensure any explicitly-configured frontend origins are included in the CORS allowlist.
    const missing = frontendOriginsToCheck.filter((origin) => !corsList.includes(origin));
    if (missing.length) {
      const msg = `CORS_ORIGINS is missing configured frontend origins: ${missing.join(", ")}`;
      if (strict) {
        throw new Error(
          `CORS_ORIGINS is missing required frontend origins: ${missing.join(", ")}`,
        );
      } else {
        // eslint-disable-next-line no-console
        console.warn(msg);
      }
    }
  }

  // Basic DB check - allow demo mode without DB
  const demoMode = process.env.USE_DEMO_DATA === "true" || process.env.E2E_MODE === "true";
  if (!process.env.DATABASE_URL && !demoMode) {
    throw new Error("DATABASE_URL must be configured (or set USE_DEMO_DATA=true for demo mode)");
  }

  // Sanity optional - warn if missing in demo environments
  if (isProduction) {
    // Sanity should be configured in production, but only fail hard in strict mode.
    if (!process.env.SANITY_STUDIO_PROJECT_ID) {
      const msg = "SANITY_STUDIO_PROJECT_ID is not set; Sanity-backed content may not load";
      if (strict) {
        throw new Error("SANITY_STUDIO_PROJECT_ID is required in production");
      } else {
        // eslint-disable-next-line no-console
        console.warn(msg);
      }
    }
    if (!process.env.SANITY_STUDIO_DATASET && !process.env.SANITY_DATASET_DEFAULT) {
      const msg =
        "SANITY_STUDIO_DATASET or SANITY_DATASET_DEFAULT is not set; default dataset will be used or content may be unavailable";
      if (strict) {
        throw new Error(
          "SANITY_DATASET is required in production (SANITY_STUDIO_DATASET or SANITY_DATASET_DEFAULT)",
        );
      } else {
        // eslint-disable-next-line no-console
        console.warn(msg);
      }
    }
    if (!process.env.SANITY_API_TOKEN) {
      const msg = "SANITY_API_TOKEN is not set; server-side Sanity operations may fail";
      if (strict) {
        throw new Error("SANITY_API_TOKEN is required in production");
      } else {
        // eslint-disable-next-line no-console
        console.warn(msg);
      }
    }
  } else {
    if (APP_ENV === "demo" && !process.env.SANITY_STUDIO_PROJECT_ID) {
      // eslint-disable-next-line no-console
      console.warn("SANITY_STUDIO_PROJECT_ID is not set; Sanity seeding may be skipped");
    }
  }

  // Preview secret and other tokens should remain server-side. Warn if missing in production.
  if (isProduction && !process.env.PREVIEW_SECRET) {
    // warn rather than fail; some deployments may not enable preview
    // eslint-disable-next-line no-console
    console.warn("PREVIEW_SECRET is not set in production — previews may be insecure or disabled");
  }

  return true;
}

export default validateEnv;
