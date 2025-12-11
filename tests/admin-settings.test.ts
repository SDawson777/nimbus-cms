import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { withAdminCookies } from "./helpers";

var fetchCMSMock: any;
var createWriteClientMock: any;
vi.mock("../server/src/lib/cms", () => {
  fetchCMSMock = vi.fn();
  createWriteClientMock = vi.fn(() => ({
    createOrReplace: vi.fn((doc: any) => Promise.resolve(doc)),
  }));
  return { fetchCMS: fetchCMSMock, createWriteClient: createWriteClientMock };
});

import app from "../server/src";

function appRequest() {
  return request(app) as any;
}

beforeEach(() => {
  fetchCMSMock.mockReset();
  createWriteClientMock.mockReset();
  process.env.JWT_SECRET = "dev-secret";
});

describe("GET/POST /api/admin/analytics/settings", () => {
  it("GET returns settings when present", async () => {
    const settings = {
      _id: "analyticsSettings-global",
      _type: "analyticsSettings",
      orgSlug: "global",
      windowDays: 14,
      recentDays: 3,
    };
    fetchCMSMock.mockResolvedValueOnce(settings);

    const token = jwt.sign(
      { id: "t", email: "a", role: "ORG_ADMIN" },
      process.env.JWT_SECRET,
    );
    const res = await appRequest()
      .get("/api/admin/analytics/settings")
      .set("Cookie", `admin_token=${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("windowDays", 14);
    expect(res.body).toHaveProperty("recentDays", 3);
  });

  it("POST creates or replaces settings and returns saved doc", async () => {
    const saved = {
      _id: "analyticsSettings-global",
      _type: "analyticsSettings",
      orgSlug: "global",
      windowDays: 20,
      recentDays: 5,
    };
    // ensure createWriteClient returns an object with createOrReplace
    createWriteClientMock.mockImplementation(() => ({
      createOrReplace: vi.fn(() => Promise.resolve(saved)),
    }));

    const token = jwt.sign(
      { id: "t", email: "a", role: "ORG_ADMIN" },
      process.env.JWT_SECRET,
    );
    const authed = withAdminCookies(appRequest(), token);
    const res = await authed
      .post("/api/admin/analytics/settings")
      .send({ windowDays: 20, recentDays: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body.settings).toHaveProperty("windowDays", 20);
    expect(res.body.settings).toHaveProperty("recentDays", 5);
  });

  it("rejects POST without CSRF token", async () => {
    const token = jwt.sign(
      { id: "t", email: "a", role: "ORG_ADMIN" },
      process.env.JWT_SECRET,
    );
    const res = await appRequest()
      .post("/api/admin/analytics/settings")
      .set("Cookie", `admin_token=${token}`)
      .send({ windowDays: 10, recentDays: 3 });
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty("error", "CSRF_MISMATCH");
  });
});
