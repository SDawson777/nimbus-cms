import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import { dashboardTool } from "@sanity/dashboard";
import dashboardConfig from "./src/dashboardConfig";

// Shared schemaTypes live at the monorepo root
import { schemaTypes } from "../../schemaTypes";
import { PREVIEW_TOKEN_ENV } from "./config/preview";

// Hardcoded projectId for Sanity-hosted Studio (env vars not available at runtime)
const projectId = "ygbu28p2";

// For Sanity-hosted Studios (e.g. *.sanity.studio) the Studio is typically
// served at the domain root. Allow overriding via env for reverse-proxied
// deployments (e.g. hosting under /studio on an API domain).
const basePath = process.env.SANITY_STUDIO_BASE_PATH || "/";

// Define shared plugins for all workspaces
const sharedPlugins = [
  deskTool(),
  visionTool(),
  dashboardTool({ widgets: dashboardConfig.widgets }),
];

// Define shared schema for all workspaces
const sharedSchema = {
  types: schemaTypes,
};

// Define experimental actions based on preview token
const experimentalActions = process.env[PREVIEW_TOKEN_ENV]
  ? ["create", "update", "publish"]
  : ["create", "update"];

// Multi-workspace configuration for dataset switching
export default defineConfig([
  {
    name: "demo",
    title: "Demo (nimbus_demo)",
    projectId,
    dataset: "nimbus_demo",
    basePath,
    plugins: sharedPlugins,
    schema: sharedSchema,
    __experimental_actions: experimentalActions,
  },
  {
    name: "preview",
    title: "Preview (nimbus_preview)",
    projectId,
    dataset: "nimbus_preview",
    basePath,
    plugins: sharedPlugins,
    schema: sharedSchema,
    __experimental_actions: experimentalActions,
  },
]);
