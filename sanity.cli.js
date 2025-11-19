import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    // prefer env vars so CLI targets the same project/dataset as the API
    projectId:
      process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ygbu28p2',
    dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  },
  /**
   * Enable auto-updates for studios.
   * Move to `deployment.autoUpdates` shape per newer Sanity recommendations.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  deployment: {autoUpdates: true},
})
