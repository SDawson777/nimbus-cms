import { createClient } from "@sanity/client";

export async function fetchCMS<T>(
  query: string,
  params: Record<string, any>,
  opts?: { preview?: boolean; fallbackPath?: string },
): Promise<T> {
  // Adds preview + JSON fallback support (no breaking changes)
  const { preview = false, fallbackPath } = opts || {};
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET || process.env.SANITY_STUDIO_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION || "2023-07-01",
    token: preview
      ? process.env.SANITY_PREVIEW_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN || process.env.SANITY_TOKEN
      : process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN || process.env.SANITY_TOKEN,
    useCdn: !preview,
    perspective: preview ? "previewDrafts" : "published",
  });
  try {
    return (await client.fetch(query, params)) as T;
  } catch (err) {
    if (fallbackPath) {
      // dynamic import fallback for JSON — avoid import assertions to support CommonJS builds
      const fallbackModule = await import(fallbackPath);
      return (fallbackModule.default || fallbackModule) as T;
    }
    throw err;
  }
}

export function createWriteClient() {
  return createClient({
    projectId: process.env.SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET || process.env.SANITY_STUDIO_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION || "2023-07-01",
    token: process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN || process.env.SANITY_TOKEN,
    useCdn: false,
  });
}
