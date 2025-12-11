import { describe, it, expect, beforeEach, vi } from "vitest";
import jwt from "jsonwebtoken";
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

describe("HTTP smoke routes", () => {
  it("GET /content/legal returns title and body", async () => {
    const doc = { title: "T", body: [{ type: "block" }] };
    fetchCMSMock.mockResolvedValueOnce(doc);
    const res = await request(app)
      .get("/content/legal")
      .query({ type: "terms" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("body");
  });

  it("GET /content/fa_q returns array of {question,answer}", async () => {
    const groups = [{ title: "g", slug: "g", items: [{ q: "how", a: "now" }] }];
    fetchCMSMock.mockResolvedValueOnce(groups);
    const res = await request(app).get("/content/fa_q");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("question");
      expect(res.body[0]).toHaveProperty("answer");
    }
  });

  it("GET /content/articles returns array of {title, slug}", async () => {
    // list count then items
    fetchCMSMock.mockResolvedValueOnce(1);
    fetchCMSMock.mockResolvedValueOnce([
      { id: "1", title: "One", slug: "one" },
    ]);
    const res = await request(app)
      .get("/content/articles")
      .query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0]).toHaveProperty("title");
    expect(res.body.items[0]).toHaveProperty("slug");
  });

  it("GET /content/articles/:slug returns single article", async () => {
    const article = { id: "1", title: "One", slug: "test-article-slug" };
    fetchCMSMock.mockResolvedValueOnce(article);
    const res = await request(app).get("/content/articles/test-article-slug");
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe("test-article-slug");
  });

  it("GET /content/filters returns array of {id,label}", async () => {
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
    const res = await request(app).get("/content/filters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("id");
      expect(res.body[0]).toHaveProperty("label");
    }
  });

  it("GET /api/admin/products returns CMSProduct[] shape", async () => {
    const products = [
      {
        _id: "p1",
        name: "P1",
        slug: "p1",
        price: 10,
        effects: ["calm"],
        productType: { title: "flower" },
        image: { url: "/img.png", alt: "img" },
      },
    ];
    fetchCMSMock.mockResolvedValueOnce(products);
    const token = jwt.sign(
      { id: "t", email: "tester", role: "EDITOR" },
      process.env.JWT_SECRET || "dev-secret",
    );
    const res = await request(app)
      .get("/api/admin/products")
      .set("Cookie", `admin_token=${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("__id");
    expect(res.body[0]).toHaveProperty("name");
    expect(res.body[0]).toHaveProperty("slug");
    expect(res.body[0]).toHaveProperty("price");
    expect(res.body[0]).toHaveProperty("type");
    expect(res.body[0]).toHaveProperty("image");
  });

  it("GET /status returns JSON status", async () => {
    const res = await request(app).get("/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("phases");
  });
});
