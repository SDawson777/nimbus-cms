import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    // Hardcoded for Sanity-hosted Studio
    projectId: "ygbu28p2",
    dataset: "nimbus_demo",
  },
  deployment: {
    appId: "aespjmcnx28x6c7zijz4t0ms",
    autoUpdates: true,
  },
});
