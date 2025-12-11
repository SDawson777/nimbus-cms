import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Ensure tests and admin UI import the same React copy from the repo root to avoid invalid hook calls
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
    },
  },
  test: {
    // Run tests in Node environment to match server behavior in CI. Individual UI tests may opt into jsdom.
    environment: "node",
    setupFiles: [path.resolve(__dirname, "tests/setupEnv.ts")],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
