import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const api = process.env.API_URL ?? "http://localhost:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The API is served from the same origin in development, so the session
    // cookie just works and no CORS preflight is needed.
    proxy: {
      "/api": api,
      "/graphql": api,
      "/sync": api,
    },
  },
});
