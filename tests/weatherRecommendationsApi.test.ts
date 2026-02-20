import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

var fetchCMSMock: any;
vi.mock("../server/src/lib/cms", () => {
  fetchCMSMock = vi.fn(async (q: string) => {
    if (q.includes("whiteLabelConfig")) {
      return {
        weatherRecommendationsWidget: {
          enabled: true,
          maxItems: 2,
          reasonChipsEnabled: true,
          recommendationsTtlSeconds: 1800,
          weatherTtlSeconds: 900,
        },
      };
    }
    if (q.includes("_type==\"product\"")) {
      return [
        {
          _id: "p1",
          name: "Rainy Day Gummies",
          slug: { current: "rainy-gummies" },
          image: "https://cdn.example.com/p1.png",
          price: 22,
          thcPercent: 10,
          cbdPercent: 0,
          strainType: "Indica",
          brand: { name: "Nimbus" },
          productType: { title: "Edibles" },
          effects: ["relaxing"],
        },
        {
          _id: "p2",
          name: "Cozy Tincture",
          slug: { current: "cozy-tincture" },
          image: "https://cdn.example.com/p2.png",
          price: 30,
          thcPercent: 5,
          cbdPercent: 2,
          strainType: "Hybrid",
          brand: { name: "Nimbus" },
          productType: { title: "Tincture" },
          effects: ["calming"],
        },
      ];
    }
    return [];
  });
  return { fetchCMS: fetchCMSMock };
});

import app from "../server/src";

beforeEach(() => {
  fetchCMSMock.mockClear();
});

describe("GET /api/v1/personalization/weather-recommendations", () => {
  it("returns weather recommendations with visual preset", async () => {
    const res = await request(app)
      .get("/api/v1/personalization/weather-recommendations")
      .query({ brandId: "brand-1", condition: "rainy", limit: 2 });

    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(true);
    expect(res.body.condition).toBe("rainy");
    expect(res.body.items.length).toBe(2);
    expect(res.body.visual).toBeTruthy();
    expect(res.body.weather).toHaveProperty("preset");
    expect(res.body.reasons).toHaveProperty("chips");
  });
});
