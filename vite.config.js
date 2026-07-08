import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: "globalThis",
  },
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // ── REST API ──────────────────────────────────────────────────────────
      // /api/... → http://localhost:8080/api/...
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },

      // ── WebSocket + SockJS HTTP fallback transports ───────────────────────
      // SockJS uses the base URL (/ws) for the initial WebSocket upgrade AND
      // for HTTP polling fallback sub-paths:
      //   /ws/info                       ← capability probe (GET)
      //   /ws/{server}/{session}/xhr_streaming  ← streaming transport (POST)
      //   /ws/{server}/{session}/eventsource    ← SSE transport (GET)
      //   /ws/{server}/{session}/xhr            ← polling transport (POST)
      //
      // All of these start with /ws so a single proxy rule handles everything.
      // ws:true enables the WebSocket upgrade on the same rule.
      "/ws": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
        // Do NOT rewrite — the backend endpoint is registered at /ws
      },
    },
  },
});
