import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './sanity/schema'
import {deskStructure} from './sanity/deskStructure'
import resolvePreviewUrl from './sanity/resolvePreviewUrl'

export default defineConfig({
  name: 'default',
  title: 'JARS CMS',

  projectId: 'ygbu28p2',
  dataset: 'production',

  plugins: [structureTool({structure: deskStructure}), visionTool()],

  schema: {
    types: schemaTypes,
  },
  document: {
    productionUrl: async (_prev, {document}) => resolvePreviewUrl(document),
  },
})
