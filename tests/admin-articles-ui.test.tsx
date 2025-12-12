/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";

import Articles from "../apps/admin/src/pages/Articles.jsx";

let container: HTMLElement | null = null;
let root: any = null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // mock fetch
  // @ts-ignore
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  try {
    if (root) root.unmount();
  } catch (e) {}
  if (container && container.parentNode)
    container.parentNode.removeChild(container);
  container = null;
  // @ts-ignore
  globalThis.fetch = undefined;
});

describe("Articles admin UI", () => {
  it("loads and updates when channel selector changes", async () => {
    // helper to poll for a condition without await-in-loop
    function waitFor(fn: () => boolean, timeout = 1000) {
      const start = Date.now();
      const interval = 10;

      return new Promise<void>((resolve, reject) => {
        function check() {
          if (fn()) {
            resolve();
            return;
          }
          if (Date.now() - start >= timeout) {
            reject(new Error("timed out waiting for condition"));
            return;
          }
          setTimeout(check, interval);
        }

        check();
      });
    }

    // initial (All) load — include a headers.get implementation so
    // `safeJson` in the app detects JSON responses when tests mock `fetch`.
    // @ts-ignore
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (_k: string) => "application/json" },
      json: async () => [
        {
          _id: "a1",
          title: "All Article",
          publishedAt: "2024-01-01",
          status: "published",
          channels: undefined,
        },
      ],
      text: async () => JSON.stringify([]),
    });

    root.render(React.createElement(Articles));
    await waitFor(() => container!.innerHTML.includes("All Article"));

    // prepare response for mobile channel
    // @ts-ignore
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (_k: string) => "application/json" },
      json: async () => [
        {
          _id: "m1",
          title: "Mobile Article",
          publishedAt: "2024-01-02",
          status: "published",
          channels: ["mobile"],
        },
      ],
      text: async () => JSON.stringify([]),
    });

    // find select and change value
    const select = container!.querySelector("select") as HTMLSelectElement;
    expect(select).toBeTruthy();
    select.value = "mobile";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    // wait for updated content to appear
    await waitFor(() => container!.innerHTML.includes("Mobile Article"));

    expect(container!.innerHTML).toContain("Mobile Article");
    // ensure All Article is not present in the mobile view
    expect(container!.innerHTML).not.toContain("All Article");
  });
});
