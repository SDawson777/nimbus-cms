import sanityClient from '@sanity/client'

export const client = sanityClient({
  projectId: 'ygbu28p2', // ✅ Replace with actual project ID
  dataset: 'production',
  apiVersion: '2023-07-25',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN_SECRET, // ✅ UPDATED for Netlify compatibility
})
