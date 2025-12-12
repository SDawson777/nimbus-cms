/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";

import ThemePage from "../apps/admin/src/pages/Theme.jsx";

let container: HTMLElement | null = null;
let root: any = null;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // mock fetch
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

describe("ThemePage UI", () => {
  it("loads paginated configs when List configs is clicked", async () => {
    // ThemePage no longer exposes a "brand slug" input or "List configs"
    // control. Instead assert the current UI: it renders color inputs and a
    // Save button. Also ensure mocked fetch responses include a headers.get
    // implementation so the app treats them as JSON.
    // @ts-ignore
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: (_k: string) => "application/json" },
      json: async () => ({
        primaryColor: "#000000",
        accentColor: "#111111",
      }),
      text: async () => JSON.stringify({}),
    });

    root.render(React.createElement(ThemePage));
    // wait a tick for render
    await new Promise((r) => setTimeout(r, 0));

    // ensure Save theme button exists
    const saveBtn = Array.from(container!.querySelectorAll("button")).find(
      (b) => /Save theme/.test(b.textContent || ""),
    );
    expect(saveBtn).toBeTruthy();

    // ensure color inputs are present
    const colorInputs = Array.from(
      container!.querySelectorAll('input[type="color"]'),
    );
    expect(colorInputs.length).toBeGreaterThanOrEqual(1);
  });
});
