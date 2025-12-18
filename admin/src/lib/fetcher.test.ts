import { describe, expect, it, vi } from "vitest";
import { HttpError, jsonFetcher } from "./fetcher";

describe("jsonFetcher", () => {
  it("returns JSON when the response is application/json", async () => {
    const payload = { ok: true };
    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

    const fetchMock = vi.fn().mockResolvedValue(response);
    global.fetch = fetchMock as typeof fetch;

    const result = await jsonFetcher<typeof payload>("/api/test");

    expect(fetchMock).toHaveBeenCalledWith("/api/test", undefined);
    expect(result).toEqual(payload);
  });

  it("returns text when the response is not JSON", async () => {
    const response = new Response("plain text", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });

    global.fetch = vi.fn().mockResolvedValue(response) as typeof fetch;

    const result = await jsonFetcher<string>("/api/text");

    expect(result).toBe("plain text");
  });

  it("throws an HttpError with the server message on 429", async () => {
    const body = { message: "Too many requests" };
    const response = new Response(JSON.stringify(body), {
      status: 429,
      headers: { "content-type": "application/json" },
    });

    global.fetch = vi.fn().mockResolvedValue(response) as typeof fetch;

    await expect(jsonFetcher("/api/limited")).rejects.toEqual(
      new HttpError(429, "Too many requests", body),
    );
  });
});
