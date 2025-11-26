import {createClient} from '@sanity/client'
export const published = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  apiVersion: process.env.SANITY_API_VERSION ?? '2025-01-01',
  useCdn: true,
})
export const drafts = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  apiVersion: process.env.SANITY_API_VERSION ?? '2025-01-01',
  token: process.env.SANITY_READ_TOKEN,
  useCdn: false,
  perspective: 'previewDrafts',
})
export const isPreview = (q: URLSearchParams) =>
  q.get('preview') === 'true' && q.get('secret') === process.env.PREVIEW_SECRET
