import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import schemaTypes from "./schemaTypes";

// v2 - Hardcoded for Sanity-hosted Studio (env vars not available at runtime)
const projectId = "ygbu28p2";
const dataset = "nimbus_demo";

export default defineConfig({
  name: "nimbus-cms",
  title: "Nimbus CMS",

  projectId,
  dataset,

  plugins: [deskTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
});
