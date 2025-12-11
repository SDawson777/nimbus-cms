import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    // prefer env vars so CLI targets the same project/dataset as the API
    projectId:
      process.env.SANITY_PROJECT_ID ||
      process.env.VITE_SANITY_PROJECT_ID ||
      "ygbu28p2",
    dataset:
      process.env.SANITY_DATASET ||
      process.env.VITE_SANITY_DATASET ||
      "production",
  },
  /**
   * Enable auto-updates for studios.
   * Move to `deployment.autoUpdates` shape per newer Sanity recommendations.
   * Learn more at https://www.sanity.io/docs/cli#auto-updates
   */
  deployment: {
    // Provided by Sanity after first deploy to avoid interactive prompt
    appId: "aespjmcnx28x6c7zijz4t0ms",
    autoUpdates: true,
  },
});
