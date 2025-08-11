import { defineConfig } from "sanity";
import { PREVIEW_TOKEN_ENV } from "./config/preview";
export default defineConfig({
  name: "jars-studio",
  title: "JARS CMS",
  // ...
  plugins: [
    // keep existing
    // enable preview in dev when token present
  ],
  // surface preview token to local dev if set
  __experimental_actions: process.env[PREVIEW_TOKEN_ENV]
    ? ["create", "update", "publish"]
    : ["create", "update"],
});
