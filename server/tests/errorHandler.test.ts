import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import errorHandler from "../src/middleware/errorHandler";
import * as sentry from "../src/lib/sentry";

vi.mock("../src/lib/sentry", () => {
  return {
    captureException: vi.fn(),
    initSentry: vi.fn(),
  };
});

describe("errorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SENTRY_DSN;
  });

  it("returns structured JSON for thrown errors", async () => {
    const app = express();

    app.get("/boom", (_req, _res) => {
      throw new Error("boom");
    });

    app.use(errorHandler);

    const res = await request(app).get("/boom");
    expect(res.status).toBe(500);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toHaveProperty("ok", false);
    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toHaveProperty("code", "INTERNAL_SERVER_ERROR");
    expect(res.body.error).toHaveProperty("message", "Internal server error");
    expect(res.body).toHaveProperty("requestId");
  });

  it("captures 5xx errors to Sentry when configured", async () => {
    process.env.SENTRY_DSN = "https://examplePublicKey@o0.ingest.sentry.io/0";

    const app = express();

    app.get("/boom", (_req, _res) => {
      throw new Error("boom");
    });

    app.use(errorHandler);

    const res = await request(app).get("/boom");
    expect(res.status).toBe(500);
    expect(sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
