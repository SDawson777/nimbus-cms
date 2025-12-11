import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";
import schemaTypes from "./schemaTypes";

const viteEnv = (typeof import.meta !== "undefined" && import.meta.env) || {};
const projectId =
  process.env.SANITY_PROJECT_ID ||
  process.env.VITE_SANITY_PROJECT_ID ||
  viteEnv.VITE_SANITY_PROJECT_ID ||
  "ygbu28p2";
const dataset =
  process.env.SANITY_DATASET ||
  process.env.VITE_SANITY_DATASET ||
  viteEnv.VITE_SANITY_DATASET ||
  "production";

export default defineConfig({
  name: "nimbus-root-studio",
  title: "Nimbus Cannabis OS CMS",

  projectId,
  dataset,

  api: {
    token: process.env.SANITY_AUTH_TOKEN,
    useCdn: false,
  },

  plugins: [deskTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
});
