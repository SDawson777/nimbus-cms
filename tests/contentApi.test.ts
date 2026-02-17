import { describe, it, expect, beforeEach, vi } from "vitest";
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

describe("GET /api/v1/content/legal", () => {
  it("returns latest legal doc", async () => {
    const doc = { title: "Terms", version: "1", updatedAt: "2024", body: [] };
    fetchCMSMock.mockResolvedValueOnce(doc);
    const res = await request(app)
      .get("/api/v1/content/legal")
      .query({ type: "terms" });
    expect(res.status).toBe(200);
    // server maps legal doc to {title, body}
    expect(res.body).toEqual({ title: doc.title, body: doc.body });
  });

  it("validates query params", async () => {
    // Previously missing `type` caused validation error. Now we default to 'terms'.
    const doc = { title: "Terms", version: "1", updatedAt: "2024", body: [] };
    fetchCMSMock.mockResolvedValueOnce(doc);
    const res = await request(app).get("/api/v1/content/legal");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ title: doc.title, body: doc.body });
  });

  it("rejects invalid tenant filters", async () => {
    const res = await request(app)
      .get("/api/v1/content/legal")
      .query({ brand: "DROP TABLE" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "INVALID_LEGAL_FILTERS");
  });
});

describe("GET /api/v1/content/faqs", () => {
  it("returns faq groups", async () => {
    const faqs = [{ title: "t", slug: "t", items: [{ q: "q", a: "a" }] }];
    fetchCMSMock.mockResolvedValueOnce(faqs);
    const res = await request(app).get("/api/v1/content/faqs");
    expect(res.status).toBe(200);
    // legacy endpoint should return groups shape
    expect(res.body).toEqual(faqs);
  });

  it("handles cms errors", async () => {
    fetchCMSMock.mockRejectedValueOnce(new Error("boom"));
    const res = await request(app).get("/api/v1/content/faqs");
    expect(res.status).toBe(500);
  });

  it("forwards channel param to CMS for faqs", async () => {
    const faqs = [{ title: "t", slug: "t", items: [{ q: "q", a: "a" }] }];
    fetchCMSMock.mockResolvedValueOnce(faqs);
    const res = await request(app)
      .get("/api/v1/content/faqs")
      .query({ channel: "web" });
    expect(res.status).toBe(200);
    const callArgs = fetchCMSMock.mock.calls[0];
    expect(callArgs[1]).toMatchObject({ channel: "web" });
  });

  it("validates slug filters for faqs", async () => {
    const res = await request(app)
      .get("/api/v1/content/faqs")
      .query({ brand: "DROP TABLE" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "INVALID_FAQ_FILTERS");
  });
});

describe("GET /api/v1/content/articles", () => {
  it("lists articles", async () => {
    const items = [
      {
        id: "1",
        title: "A",
        slug: "a",
        excerpt: "ex",
        body: [],
        cover: { src: "", alt: "" },
        tags: [],
        author: "auth",
        publishedAt: "2024",
        featured: false,
      },
    ];
    fetchCMSMock.mockResolvedValueOnce(1);
    fetchCMSMock.mockResolvedValueOnce(items);
    const res = await request(app)
      .get("/api/v1/content/articles")
      .query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      items,
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it("returns single article", async () => {
    const item = {
      id: "1",
      title: "A",
      slug: "a",
      excerpt: "ex",
      body: [],
      cover: { src: "", alt: "" },
      tags: [],
      author: "auth",
      publishedAt: "2024",
      featured: false,
    };
    fetchCMSMock.mockResolvedValueOnce(item);
    const res = await request(app).get("/api/v1/content/articles/a");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(item);
  });

  it("404 when article missing", async () => {
    fetchCMSMock.mockResolvedValueOnce(null);
    const res = await request(app).get("/api/v1/content/articles/missing");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "NOT_FOUND" });
  });

  it("validates query params", async () => {
    const res = await request(app)
      .get("/api/v1/content/articles")
      .query({ limit: 100 });
    expect(res.status).toBe(500);
  });

  it("forwards channel param to CMS for list queries", async () => {
    const items = [
      {
        id: "1",
        title: "A",
        slug: "a",
        excerpt: "ex",
        body: [],
        cover: { src: "", alt: "" },
        tags: [],
        author: "auth",
        publishedAt: "2024",
        featured: false,
      },
    ];
    fetchCMSMock.mockResolvedValueOnce(1); // total
    fetchCMSMock.mockResolvedValueOnce(items); // items
    const res = await request(app)
      .get("/api/v1/content/articles")
      .query({ page: 1, limit: 10, channel: "mobile" });
    expect(res.status).toBe(200);
    // ensure server forwarded channel param to fetchCMS (second call params)
    const secondCallArgs = fetchCMSMock.mock.calls[1];
    expect(secondCallArgs).toBeDefined();
    expect(secondCallArgs[1]).toMatchObject({ channel: "mobile" });
  });
});

describe("GET /api/v1/content/filters", () => {
  it("returns filters and categories", async () => {
    const categories = [{ name: "c", slug: "c", iconRef: "i", weight: 1 }];
    const filters = [
      {
        name: "f",
        slug: "f",
        type: "select",
        options: [{ label: "L", value: "v" }],
      },
    ];
    fetchCMSMock.mockResolvedValueOnce(categories);
    fetchCMSMock.mockResolvedValueOnce(filters);
    const res = await request(app).get("/api/v1/content/filters");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ categories, filters });
  });

  it("handles cms errors", async () => {
    fetchCMSMock.mockRejectedValueOnce(new Error("fail"));
    const res = await request(app).get("/api/v1/content/filters");
    expect(res.status).toBe(500);
  });
});

describe("Mobile and legacy endpoints consistency", () => {
  it("legal: /content/legal matches /api/v1/content/legal", async () => {
    const doc = { title: "Terms", version: "1", updatedAt: "2024", body: [] };
    fetchCMSMock.mockResolvedValueOnce(doc);
    const resLegacy = await request(app)
      .get("/api/v1/content/legal")
      .query({ type: "terms" });
    expect(resLegacy.status).toBe(200);
    expect(resLegacy.body).toEqual({ title: doc.title, body: doc.body });

    fetchCMSMock.mockResolvedValueOnce(doc);
    const resMobile = await request(app)
      .get("/content/legal")
      .query({ type: "terms" });
    expect(resMobile.status).toBe(200);
    // Mobile endpoint returns extended shape with version/effectiveFrom
    expect(resMobile.body).toHaveProperty("title", doc.title);
    expect(resMobile.body).toHaveProperty("body");
    expect(resMobile.body).toHaveProperty("version");
  });

  it("faqs: /content/fa_q matches /api/v1/content/faqs", async () => {
    const faqs = [{ title: "g", slug: "g", items: [{ q: "qq", a: "aa" }] }];
    fetchCMSMock.mockResolvedValueOnce(faqs);
    const resLegacy = await request(app).get("/api/v1/content/faqs");
    expect(resLegacy.status).toBe(200);
    // legacy returns groups shape
    expect(resLegacy.body).toEqual(faqs);

    fetchCMSMock.mockResolvedValueOnce(faqs);
    const resMobile = await request(app).get("/content/fa_q");
    expect(resMobile.status).toBe(200);
    expect(resMobile.body).toEqual([
      { id: "g-0", question: "qq", answer: "aa" },
    ]);
  });

  it("articles: /content/articles and /api/v1/content/articles consistent", async () => {
    const items = [
      {
        id: "1",
        title: "A",
        slug: "a",
        excerpt: "ex",
        body: [],
        cover: { src: "", alt: "" },
        tags: [],
        author: "auth",
        publishedAt: "2024",
        featured: false,
      },
    ];
    fetchCMSMock.mockResolvedValueOnce(1);
    fetchCMSMock.mockResolvedValueOnce(items);
    const resLegacy = await request(app)
      .get("/api/v1/content/articles")
      .query({ page: 1, limit: 10 });
    expect(resLegacy.status).toBe(200);
    expect(resLegacy.body).toEqual({
      items,
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });

    fetchCMSMock.mockResolvedValueOnce(1);
    fetchCMSMock.mockResolvedValueOnce(items);
    const resMobile = await request(app)
      .get("/content/articles")
      .query({ page: 1, limit: 10 });
    expect(resMobile.status).toBe(200);
    expect(resMobile.body).toEqual({
      items,
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });
});

describe("GET /api/v1/content/deals", () => {
  it("returns deals", async () => {
    const items = [
      {
        title: "Deal",
        slug: "deal",
        badge: "",
        ctaText: "Buy",
        ctaLink: "/",
        image: { src: "", alt: "" },
        priority: 1,
        startAt: "2023",
        endAt: "2024",
        stores: ["s1"],
      },
    ];
    fetchCMSMock.mockResolvedValueOnce(items);
    const res = await request(app)
      .get("/api/v1/content/deals")
      .query({ limit: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(items);
  });

  it("validates query params", async () => {
    const res = await request(app)
      .get("/api/v1/content/deals")
      .query({ limit: 0 });
    expect(res.status).toBe(400);
  });

  it("rejects invalid tenant filters", async () => {
    const res = await request(app)
      .get("/api/v1/content/deals")
      .query({ brand: "DROP TABLE" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "INVALID_DEAL_FILTERS");
  });
});

describe("GET /api/v1/content/copy", () => {
  it("returns app copy", async () => {
    const items = [{ key: "hello", text: "world" }];
    fetchCMSMock.mockResolvedValueOnce(items);
    const res = await request(app)
      .get("/api/v1/content/copy")
      .query({ context: "onboarding" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(items);
  });

  it("requires context", async () => {
    const res = await request(app).get("/api/v1/content/copy");
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "INVALID_COPY_CONTEXT");
  });
});

describe("Mobile Sanity promos pipeline", () => {
  it("returns promos from /mobile/sanity/promos", async () => {
    const promos = [
      {
        _id: "promo-1",
        title: "Weekend Promo",
        promoCode: "SAVE10",
        discountPercent: 0.1,
      },
    ];
    fetchCMSMock.mockResolvedValueOnce(promos);

    const res = await request(app).get("/mobile/sanity/promos");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ promos });
  });

  it("includes promos in /mobile/sanity/all", async () => {
    fetchCMSMock.mockResolvedValueOnce([{ _id: "article-1" }]); // articles
    fetchCMSMock.mockResolvedValueOnce([{ _id: "category-1" }]); // categories
    fetchCMSMock.mockResolvedValueOnce([{ _id: "faq-1" }]); // faqs
    fetchCMSMock.mockResolvedValueOnce([{ _id: "banner-1" }]); // banners
    fetchCMSMock.mockResolvedValueOnce([{ _id: "promo-1" }]); // promos
    fetchCMSMock.mockResolvedValueOnce([{ _id: "deal-1" }]); // deals
    fetchCMSMock.mockResolvedValueOnce([{ _id: "brand-1" }]); // brands
    fetchCMSMock.mockResolvedValueOnce({ primaryColor: "#000" }); // theme
    fetchCMSMock.mockResolvedValueOnce([{ _id: "effect-1" }]); // effects

    const res = await request(app).get("/mobile/sanity/all");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("promos");
    expect(res.body.promos).toEqual([{ _id: "promo-1" }]);
    expect(fetchCMSMock).toHaveBeenCalledTimes(9);
  });
});
