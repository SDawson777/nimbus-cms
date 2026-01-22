import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import { dashboardTool } from "@sanity/dashboard";
import dashboardConfig from "./src/dashboardConfig";

// Shared schemaTypes live at the monorepo root
import { schemaTypes } from "../../schemaTypes";

// Hardcoded values for Sanity-hosted Studio (env vars not available at runtime)
const projectId = "ygbu28p2";
const basePath = "/";

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
  },
  {
    name: "preview",
    title: "Preview (nimbus_preview)",
    projectId,
    dataset: "nimbus_preview",
    basePath,
    plugins: sharedPlugins,
    schema: sharedSchema,
  },
]);
