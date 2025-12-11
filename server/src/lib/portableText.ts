// Portable Text -> HTML serializer for server-side rendering.
// Prefer a full-featured renderer if the optional dependency
// `@portabletext/to-html` is installed. Otherwise fall back to
// a lightweight, permissive serializer implemented below.
import { logger } from "./logger";

let thirdPartyRenderer: ((blocks: any) => string) | null = null;
try {
  // Use a dynamic require in a try/catch so having the package be
  // absent doesn't break the server. Some environments are ESM-only,
  // so guard access to `require`.
  const req: any = typeof require === "function" ? require : null;
  if (req) {
    const mod = req("@portabletext/to-html");
    // library may export default or named `toHTML`/`toHtml`/`toHTML`
    if (mod) {
      thirdPartyRenderer = mod.toHTML || mod.toHtml || mod.default || mod;
    }
  }
} catch {
  // ignore - optional dependency not installed
}

export function portableTextToHtml(blocks: any): string {
  if (!blocks) return "";
  if (!Array.isArray(blocks)) return "";

  // If a third-party renderer is available, use it. Keep call synchronous
  // to avoid changing existing consumers.
  if (thirdPartyRenderer) {
    try {
      return String(thirdPartyRenderer(blocks));
    } catch (err) {
      // if the third-party renderer throws for some inputs, fall back
      // to the lightweight serializer below.
      logger.warn("portableText.third_party_failed", err);
    }
  }

  // Lightweight fallback serializer: handles common block types and simple marks.
  const out: string[] = [];
  for (const b of blocks) {
    if (!b || b._type === "span" || b.type === "span") continue;
    if (b._type === "block" || b.type === "block") {
      // join spans
      const children = (b.children || []).map((c: any) => {
        let text = escapeHtml(String(c.text || ""));
        if (c.marks && c.marks.length) {
          // naive: wrap strong/em
          if (c.marks.includes("strong")) text = `<strong>${text}</strong>`;
          if (c.marks.includes("em")) text = `<em>${text}</em>`;
        }
        return text;
      });
      out.push(`<p>${children.join("")}</p>`);
    } else if (b._type === "image" || b.type === "image") {
      const url = (b.asset && b.asset.url) || b.url || "";
      const alt = b.alt || "";
      out.push(`<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"/>`);
    } else if (b._type === "blockquote" || b.type === "blockquote") {
      const txt = (b.children || [])
        .map((c: any) => escapeHtml(String(c.text || "")))
        .join("");
      out.push(`<blockquote>${txt}</blockquote>`);
    } else {
      // fallback: JSON stringify
      out.push(`<pre>${escapeHtml(JSON.stringify(b))}</pre>`);
    }
  }
  return out.join("\n");
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
