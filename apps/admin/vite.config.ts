import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: "./",
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      // During local dev/e2e, serve the Admin UI from Vite but proxy all
      // backend calls to the Nimbus server so cookies/CSRF stay same-origin.
      "/api": {
        target: process.env.NIMBUS_API_URL || "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/admin": {
        target: process.env.NIMBUS_API_URL || "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/healthz": {
        target: process.env.NIMBUS_API_URL || "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
      "/status": {
        target: process.env.NIMBUS_API_URL || "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./index.html", import.meta.url)),
    },
  },
  define: {
    "process.env": process.env,
  },
});
