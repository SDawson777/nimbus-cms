import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import schemaTypes from './schemaTypes'

export default defineConfig({
  name: 'nimbus-root-studio',
  title: 'Nimbus Cannabis OS CMS',

  projectId: process.env.SANITY_PROJECT_ID || 'ygbu28p2',
  dataset: process.env.SANITY_DATASET || 'production',

  api: {
    token: process.env.SANITY_AUTH_TOKEN,
    useCdn: false,
  },

  plugins: [deskTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
