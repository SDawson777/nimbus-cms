import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import { dashboardTool } from "@sanity/dashboard";
import dashboardConfig from "./src/dashboardConfig";

// Shared schemaTypes live at the monorepo root
import { schemaTypes } from "../../schemaTypes";
import { PREVIEW_TOKEN_ENV } from "./config/preview";

// Prefer generic SANITY_PROJECT_ID / SANITY_DATASET, fall back to SANITY_STUDIO_* for compatibility
const projectId =
  process.env.SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  "ygbu28p2";
const dataset =
  process.env.SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  "nimbus_demo";

export default defineConfig({
  name: "nimbus-studio",
  title: "Nimbus Cannabis OS CMS",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [
    deskTool(),
    visionTool(),
    // Enable the Studio dashboard and mount our custom widgets
    dashboardTool({ widgets: dashboardConfig.widgets }),
  ],
  schema: {
    // Single source of truth for content model
    types: schemaTypes,
  },
  // surface preview token to local dev if set
  __experimental_actions: process.env[PREVIEW_TOKEN_ENV]
    ? ["create", "update", "publish"]
    : ["create", "update"],
});
