import { createClient } from '@sanity/client'

export async function fetchCMS<T>(
  query: string,
  params: Record<string, any>,
  opts?: { preview?: boolean; fallbackPath?: string }
): Promise<T> {
  // Adds preview + JSON fallback support (no breaking changes)
  const { preview = false, fallbackPath } = opts || {}
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION || '2023-07-01',
    token: preview
      ? process.env.SANITY_PREVIEW_TOKEN || process.env.SANITY_API_TOKEN
      : process.env.SANITY_API_TOKEN,
    useCdn: !preview,
    perspective: preview ? 'previewDrafts' : 'published'
  })
  try {
    return (await client.fetch(query, params)) as T
  } catch (err) {
    if (fallbackPath) {
      const fallback = await import(fallbackPath)
      return (fallback.default || fallback) as T
    }
    throw err
  }
}
