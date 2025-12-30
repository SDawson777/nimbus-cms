import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('validateEnv middleware', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('throws when JWT_SECRET is too short in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://user@localhost/db';
    process.env.JWT_SECRET = 'short-secret';
    process.env.STRICT_ENV_VALIDATION = 'true';
    // load module dynamically after env is set
    const mod = await import('../src/middleware/validateEnv');
    expect(() => mod.validateEnv()).toThrow();
  });

  it('does not throw for a long secret in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://user@localhost/db';
    process.env.JWT_SECRET = 'a'.repeat(40);
    process.env.CORS_ORIGINS = 'http://localhost:5173';
    process.env.SANITY_STUDIO_PROJECT_ID = 'proj';
    process.env.SANITY_STUDIO_DATASET = 'dataset';
    process.env.SANITY_API_TOKEN = 'token';
    const mod = await import('../src/middleware/validateEnv');
    expect(() => mod.validateEnv()).not.toThrow();
  });

  it('only warns (does not throw) for weak JWT when strict validation is disabled', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://user@localhost/db';
    process.env.JWT_SECRET = 'short-secret';
    delete process.env.STRICT_ENV_VALIDATION;
    const mod = await import('../src/middleware/validateEnv');
    expect(() => mod.validateEnv()).not.toThrow();
  });
});
