import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import * as complianceLib from "../server/src/lib/compliance";
import { __clearComplianceOverviewCacheForTests } from "../server/src/routes/admin";
import { withAdminCookies } from "./helpers";

var fetchCMSMock: any;
vi.mock("../server/src/lib/cms", () => {
  fetchCMSMock = vi.fn();
  return { fetchCMS: fetchCMSMock };
});

import app from "../server/src";

function appRequest() {
  return request(app) as any;
}

beforeEach(() => {
  fetchCMSMock.mockReset();
  process.env.JWT_SECRET = "dev-secret";
  __clearComplianceOverviewCacheForTests();
});

describe("GET /api/admin/compliance/overview", () => {
  it("returns per-store compliance for admin", async () => {
    const stores = [
      { _id: "s1", slug: "store-a", stateCode: "MI" },
      { _id: "s2", slug: "store-b", stateCode: "AZ" },
    ];
    const legalDocs = [
      {
        _id: "l1",
        type: "terms",
        stateCode: "MI",
        version: "1",
        effectiveFrom: new Date().toISOString(),
      },
      {
        _id: "l2",
        type: "privacy",
        stateCode: null,
        version: "2",
        effectiveFrom: new Date().toISOString(),
      },
    ];
    // endpoint prefers snapshot fetch first; return null snapshot then provide stores and legalDocs
    fetchCMSMock.mockResolvedValueOnce(null); // snapshot not found
    fetchCMSMock.mockResolvedValueOnce(stores);
    fetchCMSMock.mockResolvedValueOnce(legalDocs);

    const token = jwt.sign(
      { id: "t", email: "a", role: "ORG_ADMIN" },
      process.env.JWT_SECRET,
    );
    const res = await request(app)
      .get("/api/admin/compliance/overview")
      .set("Cookie", `admin_token=${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    const a = res.body.find((r: any) => r.storeSlug === "store-a");
    expect(a).toHaveProperty("complianceScore");
    expect(a).toHaveProperty("missingTypes");
  });

  it("caches live compliance responses for repeated requests", async () => {
    fetchCMSMock.mockResolvedValueOnce(null); // snapshot miss
    const computeSpy = vi
      .spyOn(complianceLib, "computeCompliance")
      .mockResolvedValueOnce([
        { storeSlug: "store-a", complianceScore: 100 } as any,
      ]);

    const token = jwt.sign(
      { id: "cache", email: "cache@example.com", role: "ORG_ADMIN" },
      process.env.JWT_SECRET,
    );

    const first = await withAdminCookies(
      appRequest().get("/api/admin/compliance/overview"),
      token,
    );
    expect(first.status).toBe(200);
    expect(first.body[0].storeSlug).toBe("store-a");
    expect(computeSpy).toHaveBeenCalledTimes(1);

    const second = await withAdminCookies(
      appRequest().get("/api/admin/compliance/overview"),
      token,
    );
    expect(second.status).toBe(200);
    expect(second.header["x-compliance-cache"]).toBe("HIT");
    expect(second.body[0].storeSlug).toBe("store-a");
    expect(computeSpy).toHaveBeenCalledTimes(1);

    computeSpy.mockRestore();
  });

  it("enforces brand scope when brand query param is provided", async () => {
    const token = jwt.sign(
      {
        id: "brand-admin",
        email: "b@a.com",
        role: "BRAND_ADMIN",
        brandSlug: "alpha",
      },
      process.env.JWT_SECRET,
    );
    const res = await (request(app) as any)
      .get("/api/admin/compliance/overview")
      .query({ brand: "beta" })
      .set("Cookie", `admin_token=${token}`);
    expect(res.status).toBe(403);
  });

  it("filters results by store query when scoped", async () => {
    fetchCMSMock.mockResolvedValueOnce(null);
    const computeSpy = vi
      .spyOn(complianceLib, "computeCompliance")
      .mockResolvedValueOnce([
        { storeSlug: "store-a", complianceScore: 100 },
        { storeSlug: "store-b", complianceScore: 80 },
      ] as any);
    const token = jwt.sign(
      { id: "org", email: "org@example.com", role: "ORG_ADMIN" },
      process.env.JWT_SECRET,
    );
    const res = await (request(app) as any)
      .get("/api/admin/compliance/overview")
      .query({ store: "store-b" })
      .set("Cookie", `admin_token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].storeSlug).toBe("store-b");
    computeSpy.mockRestore();
  });
});
