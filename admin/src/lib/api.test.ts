import { describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { HttpError } from "./fetcher";

describe("api.get", () => {
  it("returns parsed JSON when successful", async () => {
    const payload = { data: "ok" };
    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const fetchMock = vi.fn().mockResolvedValue(response);
    global.fetch = fetchMock as typeof fetch;

    const result = await api.get("/status");

    expect(fetchMock).toHaveBeenCalledWith("/status", { credentials: "include" });
    expect(result).toEqual(payload);
  });

  it("returns text when successful but content-type is not JSON", async () => {
    const response = new Response("hello", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });

    global.fetch = vi.fn().mockResolvedValue(response) as typeof fetch;

    const result = await api.get("/hello");

    expect(result).toBe("hello");
  });

  it("throws HttpError with server message on 429", async () => {
    const message = "Too many requests";
    const response = new Response(message, {
      status: 429,
      headers: { "content-type": "text/plain" },
    });

    global.fetch = vi.fn().mockResolvedValue(response) as typeof fetch;

    await expect(api.get("/limited")).rejects.toEqual(
      new HttpError(429, message, message),
    );
  });
});
