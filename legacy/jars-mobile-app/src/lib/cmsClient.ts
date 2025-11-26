const baseUrl = process.env.EXPO_PUBLIC_CMS_BASE_URL
if (!baseUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_CMS_BASE_URL environment variable. Set this to your CMS's base URL.",
  )
}

if (process.env.NODE_ENV !== 'production') {
  // Log the CMS base URL in development for easier troubleshooting

  console.log(`CMS base URL: ${baseUrl}`)
}

export const CMS_BASE = baseUrl
async function getJSON(path: string, params?: Record<string, string | number | boolean>) {
  const url = new URL(path, CMS_BASE)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString(), {headers: {Accept: 'application/json'}})
  if (!res.ok) throw new Error(`CMS ${res.status}`)
  return res.json()
}
export const cms = {
  legal: (
    type: 'terms' | 'privacy' | 'accessibility',
    preview?: {enabled: boolean; secret: string},
  ) =>
    getJSON('/api/v1/content/legal', {
      type,
      ...(preview?.enabled ? {preview: true, secret: preview.secret} : {}),
    }),
  faqs: (preview?: {enabled: boolean; secret: string}) =>
    getJSON(
      '/api/v1/content/faqs',
      preview?.enabled ? {preview: true, secret: preview.secret} : undefined,
    ),
  articles: (
    q: {page?: number; limit?: number; tag?: string},
    preview?: {enabled: boolean; secret: string},
  ) =>
    getJSON('/api/v1/content/articles', {
      page: q.page ?? 1,
      limit: q.limit ?? 20,
      ...(q.tag ? {tag: q.tag} : {}),
      ...(preview?.enabled ? {preview: true, secret: preview.secret} : {}),
    }),
  article: (slug: string, preview?: {enabled: boolean; secret: string}) =>
    getJSON(
      `/api/v1/content/articles/${slug}`,
      preview?.enabled ? {preview: true, secret: preview.secret} : undefined,
    ),
  filters: () => getJSON('/api/v1/content/filters'),
  deals: (q: {storeId?: string; limit?: number}) =>
    getJSON('/api/v1/content/deals', {
      ...(q.storeId ? {storeId: q.storeId} : {}),
      limit: q.limit ?? 20,
    }),
  copy: (context: 'onboarding' | 'emptyStates' | 'awards' | 'accessibility' | 'dataTransparency') =>
    getJSON('/api/v1/content/copy', {context}),
}
