import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Ensure tests and admin UI import the same React copy from the repo root to avoid invalid hook calls
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
    // Prefer Node conditional exports to improve compatibility when resolving CJS packages
    conditions: ["node"],
  },
  // When running tests, externalize certain CJS-only packages to avoid
  // Vite's ESM import-analysis errors (some packages expose only CJS entrypoints).
  // `supertest` in particular can trigger package entry resolution failures.
  ssr: {
    external: ["supertest"],
  },
  test: {
    deps: {
      external: ["supertest"],
    },
    // Run tests in Node environment to match server behavior in CI. Individual UI tests may opt into jsdom.
    environment: "node",
    setupFiles: [path.resolve(__dirname, "tests/setupEnv.ts")],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
