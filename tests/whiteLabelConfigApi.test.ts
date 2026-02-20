import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

var fetchCMSMock: any;
vi.mock("../server/src/lib/cms", () => {
  fetchCMSMock = vi.fn();
  return { fetchCMS: fetchCMSMock };
});

import app from "../server/src";

beforeEach(() => {
  fetchCMSMock.mockReset();
});

describe("GET /api/v1/content/white-label-config", () => {
  it("returns mobile-safe widget config and strips provider fields", async () => {
    fetchCMSMock.mockResolvedValueOnce({
      brand: "jars",
      weatherRecommendationsWidget: {
        enabled: true,
        title: "Custom Title",
        providerMode: "brand_selected",
        provider: "openweather",
        providerConfigRef: "secret-ref",
      },
    });

    const res = await request(app)
      .get("/api/v1/content/white-label-config")
      .query({ brandId: "brand-123" });

    expect(res.status).toBe(200);
    expect(res.body.weatherRecommendationsWidget.enabled).toBe(true);
    expect(res.body.weatherRecommendationsWidget.title).toBe("Custom Title");
    expect(res.body.weatherRecommendationsWidget.ctaText).toBe("See all");
    expect(res.body.weatherRecommendationsWidget.provider).toBeUndefined();
    expect(res.body.weatherRecommendationsWidget.providerConfigRef).toBeUndefined();
    expect(res.body.weatherRecommendationsWidget.providerMode).toBeUndefined();
  });

  it("returns 404 when no config exists", async () => {
    fetchCMSMock.mockResolvedValueOnce(null);
    const res = await request(app)
      .get("/api/v1/content/white-label-config")
      .query({ brandId: "brand-123" });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "NOT_FOUND");
  });
});
