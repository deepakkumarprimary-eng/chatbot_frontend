# Tech Stack

## Core

- **Framework**: React 19 (functional components, hooks only)
- **Language**: JavaScript (JSX) — no TypeScript
- **Build Tool**: Vite 8
- **Package Manager**: npm

## Key Libraries

| Library | Purpose |
|---------|---------|
| `@xyflow/react` | Node-based workflow graph editor (ReactFlow) |
| `react-router-dom` v7 | Client-side routing (createBrowserRouter) |
| `react-bootstrap` + `bootstrap` | UI components and grid layout |
| `@mui/material` + `@emotion/react` | Additional Material UI components |
| `axios` | HTTP client for REST API calls |
| `@stomp/stompjs` + `sockjs-client` | WebSocket real-time chat communication |

## Linting

- ESLint 10 with flat config (`eslint.config.js`)
- Plugins: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`

## Dev Server

Vite config defines `global: "globalThis"` for SockJS compatibility.

## Common Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
```
