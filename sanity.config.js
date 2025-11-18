import {defineConfig} from 'sanity'
import dotenv from 'dotenv'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './jars-cms/sanity/schema'

export default defineConfig({
  name: 'default',
  title: 'JARS CMS',

  projectId: 'ygbu28p2',
  dataset: 'staging',

  api: {
    token: process.env.SANITY_AUTH_TOKEN,
    useCdn: false,
  },

  plugins: [deskTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
