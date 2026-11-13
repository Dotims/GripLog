import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const api = process.env.API_URL ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same origin in development, so the session cookie works without CORS.
    proxy: {
      "/api": api,
      "/graphql": api,
      "/sync": api,
    },
  },
});
