// ─── Centralized API configuration ───────────────────────────────────────────
// All requests go through Vite's dev proxy (/api → http://localhost:8080/api)
// so no absolute URLs are needed. For production, set VITE_API_BASE_URL.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";

// WS_URL must be a relative path in dev so SockJS HTTP fallback transports
// (xhr_streaming, eventsource, xhr polling) also flow through the Vite proxy.
// If an absolute URL is used, SockJS builds polling sub-paths like
// http://localhost:3000/ws/info which bypass the proxy and hit the frontend
// dev server instead of the backend.
//
// Relative "/ws" → SockJS polls "/ws/info", "/ws/{s}/{t}/xhr_streaming" etc.
// → all caught by the Vite proxy rule and forwarded to http://localhost:8080
//
// In production: set VITE_WS_URL to the full backend WS origin, e.g.
//   https://api.yourapp.com/ws
export const WS_URL =
  import.meta.env.VITE_WS_URL ?? "/ws";

// ─── WebSocket API Key ────────────────────────────────────────────────────────
// Sent as the X-API-Key native header on every STOMP CONNECT frame.
// The backend's WebSocketAuthInterceptor validates this key before allowing
// any connection. Set VITE_WS_API_KEY in your .env file.
// Dev default matches application-dev.properties: websocket.api-key=dev-api-key-12345
export const WS_API_KEY =
  import.meta.env.VITE_WS_API_KEY ?? "dev-api-key-12345";
