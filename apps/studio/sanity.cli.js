import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId:
      process.env.SANITY_PROJECT_ID ||
      process.env.SANITY_STUDIO_PROJECT_ID ||
      "ygbu28p2",
    dataset:
      process.env.SANITY_DATASET ||
      process.env.SANITY_STUDIO_DATASET ||
      "production",
  },
  studioHost: "nimbus-cms",
  deployment: {
    appId: "aespjmcnx28x6c7zijz4t0ms",
  },
});
