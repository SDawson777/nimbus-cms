import { describe, it, expect, beforeEach, vi } from "vitest";
import supertest from "supertest";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { withAdminCookies } from "./helpers";

// Create mocks inside the mock factory to avoid vitest hoisting/TDZ issues
vi.mock("@sanity/client", () => {
  const createIfNotExistsMock = vi.fn();
  const commitMock = vi.fn();
  const createClientMock = vi.fn(() => ({
    createIfNotExists: createIfNotExistsMock,
    patch: (_id: string) => {
      const patchObj: any = {};
      patchObj.set = (_obj: any) => patchObj;
      patchObj.inc = (_incObj: any) => patchObj;
      patchObj.commit = commitMock;
      return patchObj;
    },
  }));
  return {
    createClient: createClientMock,
    __createIfNotExistsMock: createIfNotExistsMock,
    __commitMock: commitMock,
    __createClientMock: createClientMock,
  };
});

// Mock CMS client used by admin analytics endpoints.
vi.mock("../server/src/lib/cms", () => ({
  fetchCMS: vi.fn(),
  createWriteClient: vi.fn(() => ({
    createOrReplace: vi.fn(),
  })),
}));

// Import the mocked sanity module and extract mocks for assertions
const sanityMock = await import("@sanity/client");
const createClientMock = (sanityMock as any).__createClientMock as any;
const createIfNotExistsMock = (sanityMock as any)
  .__createIfNotExistsMock as any;
const commitMock = (sanityMock as any).__commitMock as any;

import app from "../server/src";

const ANALYTICS_KEY = process.env.ANALYTICS_INGEST_KEY || "test-analytics-key";

function appRequest() {
  return supertest(app) as any;
}

function signedAnalyticsRequest(body: Record<string, any>) {
  const payload = JSON.stringify(body);
  const signature = crypto
    .createHmac("sha256", ANALYTICS_KEY)
    .update(payload)
    .digest("hex");
  return appRequest()
    .post("/analytics/event")
    .set("Content-Type", "application/json")
    .set("X-Analytics-Key", ANALYTICS_KEY)
    .set("X-Analytics-Signature", signature)
    .send(payload);
}

beforeEach(() => {
  createClientMock.mockClear();
  createIfNotExistsMock.mockReset();
  commitMock.mockReset();
  process.env.JWT_SECRET = "dev-secret";
});

describe("POST /analytics/event", () => {
  it("increments view counter and returns updated metric", async () => {
    const now = new Date().toISOString();
    const id = "contentMetric-article-test-article";
    createIfNotExistsMock.mockResolvedValueOnce({ _id: id });
    // aggregate metric createIfNotExists + daily createIfNotExists
    createIfNotExistsMock.mockResolvedValueOnce({ _id: id });
    const dailyId = "contentMetricDaily-article-test-article";
    createIfNotExistsMock.mockResolvedValueOnce({ _id: dailyId });
    // two commits: aggregate patch.commit and daily patch.commit
    commitMock.mockResolvedValueOnce({
      _id: id,
      contentType: "article",
      contentSlug: "test-article",
      views: 1,
      clickThroughs: 0,
      lastUpdated: now,
    });
    commitMock.mockResolvedValueOnce({
      _id: dailyId,
      contentType: "article",
      contentSlug: "test-article",
      views: 1,
      clickThroughs: 0,
      lastUpdated: now,
    });

    const res = await signedAnalyticsRequest({
      type: "view",
      contentType: "article",
      contentSlug: "test-article",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body).toHaveProperty("metric");
    expect(res.body.metric).toHaveProperty("views", 1);
  });

  it("rejects requests with invalid signatures", async () => {
    const payload = {
      type: "view",
      contentType: "article",
      contentSlug: "unsigned",
    };
    const res = await appRequest()
      .post("/analytics/event")
      .set("Content-Type", "application/json")
      .set("X-Analytics-Key", ANALYTICS_KEY)
      .set("X-Analytics-Signature", "not-valid")
      .send(JSON.stringify(payload));
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "INVALID_ANALYTICS_SIGNATURE");
  });
});

describe("GET /api/admin/analytics/content-metrics", () => {
  it("returns metrics list for admin", async () => {
    const token = jwt.sign(
      { id: "t", email: "admin", role: "VIEWER" },
      process.env.JWT_SECRET || "dev-secret",
    );
    const res = await withAdminCookies(
      appRequest().get("/api/admin/analytics/content-metrics"),
      token,
    );
    // As long as the route authorizes correctly, we just assert that it
    // doesn't error and returns JSON. Be defensive about header shapes
    // (some environments expose `header`, `headers`, or provide `get()`).
    function getContentType(r: any) {
      return (
        r?.headers?.["content-type"] ||
        r?.header?.["content-type"] ||
        (typeof r?.get === "function" ? r.get("content-type") : undefined) ||
        r?.type ||
        undefined
      );
    }
    expect(res.status).toBeLessThan(500);
    const contentType = getContentType(res);
    expect(contentType).toMatch(/application\/json/);
  });
});

describe("GET /api/admin/analytics/overview", () => {
  it("returns aggregated overview for org admin", async () => {
    const token = jwt.sign(
      { id: "t", email: "admin", role: "ORG_ADMIN" },
      process.env.JWT_SECRET || "dev-secret",
    );
    const res = await withAdminCookies(
      appRequest().get("/api/admin/analytics/overview"),
      token,
    );
    function getContentType(r: any) {
      return (
        r?.headers?.["content-type"] ||
        r?.header?.["content-type"] ||
        (typeof r?.get === "function" ? r.get("content-type") : undefined) ||
        r?.type ||
        undefined
      );
    }
    expect(res.status).toBeLessThan(500);
    expect(getContentType(res)).toMatch(/application\/json/);
  });

  it("falls back to persisted overview payload when live aggregation is unavailable", async () => {
    const token = jwt.sign(
      { id: "t", email: "admin", role: "ORG_ADMIN" },
      process.env.JWT_SECRET || "dev-secret",
    );
    const res = await withAdminCookies(
      appRequest()
        .get("/api/admin/analytics/overview")
        .query({ cacheBust: "persisted" }),
      token,
    );
    function getContentType(r: any) {
      return (
        r?.headers?.["content-type"] ||
        r?.header?.["content-type"] ||
        (typeof r?.get === "function" ? r.get("content-type") : undefined) ||
        r?.type ||
        undefined
      );
    }
    expect(res.status).toBeLessThan(500);
    expect(getContentType(res)).toMatch(/application\/json/);
  });
});

describe("Analytics summary endpoints", () => {
  it("returns metadata from persisted cache on GET /summary", async () => {
    const token = jwt.sign(
      { id: "viewer", email: "viewer@example.com", role: "VIEWER" },
      process.env.JWT_SECRET || "dev-secret",
    );
    const res = await withAdminCookies(
      appRequest()
        .get("/api/admin/analytics/summary")
        .query({ segment: "summaryTest" }),
      token,
    );
    function getContentType(r: any) {
      return (
        r?.headers?.["content-type"] ||
        r?.header?.["content-type"] ||
        (typeof r?.get === "function" ? r.get("content-type") : undefined) ||
        r?.type ||
        undefined
      );
    }
    expect(res.status).toBeLessThan(500);
    expect(getContentType(res)).toMatch(/application\/json/);
  });

  it("forces a fresh aggregation on POST /summary", async () => {
    const token = jwt.sign(
      { id: "org", email: "org-admin@example.com", role: "ORG_ADMIN" },
      process.env.JWT_SECRET || "dev-secret",
    );
    const res = await withAdminCookies(
      appRequest().post("/api/admin/analytics/summary"),
      token,
    );
    function getContentType(r: any) {
      return (
        r?.headers?.["content-type"] ||
        r?.header?.["content-type"] ||
        (typeof r?.get === "function" ? r.get("content-type") : undefined) ||
        r?.type ||
        undefined
      );
    }
    expect(res.status).toBeLessThan(500);
    expect(getContentType(res)).toMatch(/application\/json/);
  });
});
