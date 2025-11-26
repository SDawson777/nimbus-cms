import {createClient} from '@sanity/client'

const config = {
  projectId: process.env.SANITY_PROJECT_ID || '',
  dataset: process.env.SANITY_DATASET || '',
  apiVersion: process.env.SANITY_API_VERSION || '2023-07-01',
  useCdn: process.env.NODE_ENV === 'production',
}

export function getClient(preview = false) {
  if (preview && process.env.SANITY_PREVIEW_TOKEN) {
    return createClient({...config, token: process.env.SANITY_PREVIEW_TOKEN, useCdn: false})
  }
  return createClient(config)
}
