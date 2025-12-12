process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.PREVIEW_SECRET =
  process.env.PREVIEW_SECRET || "test-preview-secret";
process.env.SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID || "test-project";
process.env.SANITY_DATASET = process.env.SANITY_DATASET || "test-dataset";
process.env.SANITY_API_TOKEN = process.env.SANITY_API_TOKEN || "test-token";
process.env.ANALYTICS_INGEST_KEY =
  process.env.ANALYTICS_INGEST_KEY || "test-analytics-key";

// Provide a default DATABASE_URL for tests to avoid bootstrap failures
// Tests do not require a real database here; Prisma/DB calls are usually mocked.
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
// Disable admin seeding during tests by default
process.env.ADMIN_SEED_ENABLED = process.env.ADMIN_SEED_ENABLED || "false";
