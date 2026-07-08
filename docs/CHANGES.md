# Frontend Refactor & Feature Sync — Change Documentation

**Date:** July 4, 2026  
**Project:** Chatbot Studio — `chatbot_frontend`  
**Scope:** Full project restructure + backend API sync

---

## Table of Contents

1. [Project Structure Reorganization](#1-project-structure-reorganization)
2. [New Files Created](#2-new-files-created)
3. [Modified Files](#3-modified-files)
4. [Functional Changes](#4-functional-changes)
5. [Bug Fixes & Backend Sync](#5-bug-fixes--backend-sync)
6. [Old Files (To Be Deleted)](#6-old-files-to-be-deleted)
7. [How to Run](#7-how-to-run)

---

## 1. Project Structure Reorganization

### Before
```
src/
├── App.jsx                        ← contained full workflow builder logic
├── App.css
├── main.jsx
├── index.css
└── module/
    ├── DecisionNode.jsx
    ├── WorkflowNode.jsx
    ├── NodeDetails.jsx
    ├── HeaderConfiguration.jsx
    ├── ChatBot/
    │   ├── ChatBot.jsx
    │   └── ChatBot.css
    ├── apiConfig/
    │   ├── ApiConfigList.jsx
    │   ├── ApiConfigForm.jsx
    │   └── ApiConfigService.jsx   ← hardcoded http://localhost:8080
    ├── workflow/
    │   ├── WorkflowList.jsx
    │   ├── WorkflowForm.jsx
    │   └── WorkflowService.jsx    ← hardcoded http://localhost:8080
    ├── layout/
    │   └── AppLayout.jsx
    ├── routing/
    │   └── Routes.jsx
    └── component/
        ├── InputField.jsx
        └── SelectComponent.jsx
```

### After
```
src/
├── api/
│   └── index.js                   ← NEW: centralized base URL config
├── components/
│   ├── InputField.jsx             ← moved from module/component/
│   └── SelectComponent.jsx        ← moved from module/component/
├── features/
│   ├── workflow/
│   │   ├── WorkflowBuilder.jsx    ← NEW: extracted from App.jsx
│   │   ├── WorkflowList.jsx       ← moved + updated imports
│   │   ├── WorkflowForm.jsx       ← moved + updated imports
│   │   ├── WorkflowService.js     ← moved + uses relative URL
│   │   └── nodes/
│   │       ├── StateNode.jsx      ← NEW: extracted from App.jsx
│   │       ├── DecisionNode.jsx   ← moved from module/
│   │       ├── WorkflowNode.jsx   ← moved from module/
│   │       ├── NodeDetails.jsx    ← moved + fixed imports
│   │       └── HeaderConfiguration.jsx ← moved from module/
│   ├── apiConfig/
│   │   ├── ApiConfigList.jsx      ← moved + updated imports
│   │   ├── ApiConfigForm.jsx      ← moved + updated imports
│   │   └── ApiConfigService.js    ← moved + uses relative URL
│   └── chatbot/
│       ├── ChatBot.jsx            ← moved + 5 functional fixes
│       └── ChatBot.css            ← moved + restart button styles
├── layout/
│   └── AppLayout.jsx              ← moved from module/layout/
├── router/
│   └── Routes.jsx                 ← moved + updated all imports
├── App.jsx                        ← now a thin empty shell (no logic)
├── main.jsx                       ← updated to import new router path
└── index.css                      ← populated: global + modal styles
```

---

## 2. New Files Created

### `src/api/index.js`
Centralized API configuration. All service files and the chatbot now import URLs from here instead of hardcoding them.

```js
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
export const WS_URL       = import.meta.env.VITE_WS_URL ?? `${window.location.origin}/ws`;
export const WS_API_KEY   = import.meta.env.VITE_WS_API_KEY ?? "dev-api-key-12345";
```

- In development: `API_BASE_URL` resolves to `""` so all calls go through the Vite proxy. `WS_API_KEY` defaults to the dev key from `application-dev.properties`.
- In production: set `VITE_API_BASE_URL`, `VITE_WS_URL`, and `VITE_WS_API_KEY` environment variables.

---

### `.env.development` *(new)*
Default environment variables for local development. Vite loads this automatically on `npm run dev`.

```env
VITE_API_BASE_URL=           # empty = use Vite proxy
VITE_WS_URL=                 # empty = use Vite proxy
VITE_WS_API_KEY=dev-api-key-12345
```

The dev API key matches `websocket.api-key=dev-api-key-12345` in `application-dev.properties`.

---

### `.env.example` *(new)*
Template file documenting all environment variables. Developers copy this to `.env.development` or `.env.production` and fill in their values. Committed to version control — contains no real secrets.
Extracted the `StateNode` React component that was previously defined inline inside `App.jsx`. It renders the purple 3D state node on the ReactFlow canvas.

---

### `src/features/workflow/WorkflowBuilder.jsx`
The full visual workflow builder logic extracted from `App.jsx`. Responsibilities:
- ReactFlow canvas with drag-and-drop
- Add child nodes with automatic decision branching
- Add workflow link nodes
- Load/restore existing workflows (edit mode)
- Save / Update workflows via `WorkflowService`
- Node settings modal (opens `NodeDetails`)
- Workflow name modal (new workflow creation)

---

## 3. Modified Files

### `vite.config.js`
Added `server.proxy` to route API and WebSocket requests to the backend during development. This eliminates all hardcoded `http://localhost:8080` URLs from the frontend.

```js
server: {
  port: 3000,
  proxy: {
    "/api": { target: "http://localhost:8080", changeOrigin: true },
    "/ws":  { target: "http://localhost:8080", changeOrigin: true, ws: true },
  },
}
```

| Before | After |
|--------|-------|
| No proxy, all URLs hardcoded to `http://localhost:8080` | Vite proxies `/api` and `/ws` to backend |
| Breaks in any non-localhost environment | Works in any environment via env variables |

---

### `src/main.jsx`
Updated the router import path from `./module/routing/Routes` to `./router/Routes`.

---

### `src/App.jsx`
Reduced to an empty shell. All builder logic moved to `WorkflowBuilder.jsx`.

```jsx
// Before: ~350 lines of ReactFlow builder logic
// After:
export default function App() { return null; }
```

---

### `src/features/workflow/WorkflowService.js`
- Moved from `src/module/workflow/WorkflowService.jsx`
- Now imports base URL from `src/api/index.js`
- No hardcoded URLs

```js
// Before
const BASE_URL = "http://localhost:8080/api/workflows";

// After
import { API_BASE_URL } from "../../api/index.js";
const BASE_URL = `${API_BASE_URL}/api/workflows`;
```

---

### `src/features/apiConfig/ApiConfigService.js`
- Moved from `src/module/apiConfig/ApiConfigService.jsx`
- Same change as WorkflowService — uses `API_BASE_URL` from `src/api/index.js`

---

### `src/features/workflow/nodes/NodeDetails.jsx`
- Moved from `src/module/NodeDetails.jsx`
- **Replaced raw `axios` calls** with proper service imports:

```jsx
// Before — raw axios with hardcoded URL
import axios from "axios";
axios.get("http://localhost:8080/api/api-configs")
axios.get("http://localhost:8080/api/workflows")

// After — uses service layer
import { ApiConfigService } from "../../apiConfig/ApiConfigService.js";
import { WorkflowService }  from "../WorkflowService.js";
ApiConfigService.getAll()
WorkflowService.getAll()
```

---

### `src/index.css`
Was empty. Now contains:
- CSS reset (`box-sizing`, `font-family`)
- ReactFlow canvas styles (gradient background, edge shadows, handle hover)
- Modal backdrop blur
- Workflow node settings modal styles (previously in `App.css`)

`App.css` is no longer imported anywhere — styles consolidated into `index.css`.

---

### `src/router/Routes.jsx`
- Moved from `src/module/routing/Routes.jsx`
- Updated all imports to point to new feature paths
- `App` component replaced with `WorkflowBuilder` component for `/builder` routes

```jsx
// Before
import App from "../../App";
{ path: "/builder",          element: <App /> },
{ path: "/builder/edit/:id", element: <App /> },

// After
import WorkflowBuilder from "../features/workflow/WorkflowBuilder";
{ path: "/builder",          element: <WorkflowBuilder /> },
{ path: "/builder/edit/:id", element: <WorkflowBuilder /> },
```

---

## 4. Functional Changes

### ChatBot — 5 fixes applied (`src/features/chatbot/ChatBot.jsx`)

#### Fix 1: WebSocket URL from centralized config
```jsx
// Before
new SockJS("http://localhost:8080/ws")

// After
import { WS_URL, WS_API_KEY } from "../../api/index.js";
new SockJS(WS_URL)
```

---

#### Fix 2 (NEW): WebSocket API key authentication
The backend's `WebSocketAuthInterceptor` validates an `X-API-Key` header on every STOMP `CONNECT` frame. Previously the frontend sent no key — every single WebSocket connection was rejected before it could start.

**How the backend checks it:**
```java
// WebSocketAuthInterceptor.java
String apiKey = accessor.getFirstNativeHeader("X-API-Key");
if (!constantTimeEquals(validApiKey, apiKey)) {
    throw new MessageDeliveryException("WebSocket authentication failed: Invalid API key.");
}
```

**Fix — pass `connectHeaders` to the STOMP client:**
```jsx
const client = new Client({
  webSocketFactory: () => new SockJS(WS_URL),
  reconnectDelay: 5000,
  connectHeaders: {
    "X-API-Key": WS_API_KEY,   // ← sent on every CONNECT frame automatically
  },
  ...
});
```

`connectHeaders` in `@stomp/stompjs` are sent as native STOMP headers on the CONNECT frame, which is exactly what `StompHeaderAccessor.getFirstNativeHeader()` reads server-side.

The key value is read from the `VITE_WS_API_KEY` environment variable and defaults to `dev-api-key-12345` (matches `application-dev.properties`).

---

#### Fix 3: Reconnection flow
The backend supports a `/app/chat.reconnect` endpoint that restores the last prompt after a dropped connection. Previously the frontend never called it — on reconnect it would call `/app/chat.init` again, losing all session state.

**New behavior:** On STOMP reconnect, if a `sessionId` already exists in the component, the client:
1. Re-subscribes to `/topic/chat/{sessionId}`
2. Publishes to `/app/chat.reconnect` with the existing `sessionId`
3. Shows a "🔄 Reconnected to server" system message in chat

```jsx
// Refs keep sessionId alive across reconnects
const sessionIdRef = useRef(null);

onConnect: () => {
  const existingSessionId = sessionIdRef.current;
  if (existingSessionId) {
    // reconnect path
    client.subscribe(`/topic/chat/${existingSessionId}`, handleTopicMessage);
    client.publish({ destination: "/app/chat.reconnect",
      body: JSON.stringify({ sessionId: existingSessionId }) });
  } else {
    // fresh init path
    client.subscribe("/app/chat.init", ...);
    client.publish({ destination: "/app/chat.init", body: "{}" });
  }
}
```

---

#### Fix 4: Error message handling
Backend sends error responses as `{ error: string, sessionId: string }` on `/topic/chat/{sessionId}`. Previously these were silently ignored.

**New behavior:** Detected in message handler and displayed as a system warning message.

```jsx
if (responseData?.error) {
  setChat((prev) => [...prev, {
    sender: "system",
    text: `⚠️ ${responseData.error}`,
    time: new Date(),
  }]);
  return;
}
```

---

#### Fix 5: Workflow `completed` state
Backend sends `completed: true` in `ChatResponse` when a workflow finishes. Previously the input box stayed active and the user could keep sending messages.

**New behavior:**
- Input is disabled when `completed === true`
- A "✅ Workflow completed" bot message is shown
- A "✅ This workflow has completed. Click Restart to begin again." system message appears
- A **Restart** button replaces the Back button in the footer

```jsx
if (responseData?.completed === true) {
  setCompleted(true);
  // show completion messages
  return;
}
```

---

#### Fix 6: Restart button
Backend supports `/app/chat.restart` but there was no UI button for it.

**New behavior:** A "🔄 Restart" button appears in the footer when the workflow is completed.

```jsx
const handleRestart = () => {
  stompClient.publish({
    destination: "/app/chat.restart",
    body: JSON.stringify({ sessionId: sessionIdRef.current }),
  });
  setCompleted(false);
};
```

CSS for the restart button added to `ChatBot.css`:
```css
.cb-restart-btn { ... }
.cb-restart-btn:hover:not(:disabled) { ... }
```

---

## 5. Bug Fixes & Backend Sync

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| All WebSocket connections silently rejected | `WebSocketAuthInterceptor` requires `X-API-Key` header on STOMP CONNECT — frontend never sent it | `connectHeaders: { "X-API-Key": WS_API_KEY }` added to STOMP client; key read from `VITE_WS_API_KEY` env var |
| All API calls failed in non-localhost environments | URLs hardcoded to `http://localhost:8080` | Vite proxy + `src/api/index.js` centralized config |
| Session lost after WebSocket reconnect | Frontend called `chat.init` again on reconnect, creating a new session | Now calls `chat.reconnect` to restore existing session |
| Backend errors silently disappeared | `{ error }` response shape not handled | Detected and shown as system message in chat |
| Input remained active after workflow completion | `completed: true` flag in `ChatResponse` was ignored | `completed` state disables input and shows restart button |
| No way to restart a workflow from UI | `/app/chat.restart` backend endpoint unused | Restart button added to chatbot footer |
| `NodeDetails` bypassed service layer | Used raw `axios` with hardcoded URLs | Replaced with `ApiConfigService` and `WorkflowService` |
| `App.jsx` contained all builder logic | No separation of concerns | Builder extracted to `WorkflowBuilder.jsx` |
| Workflow builder routed through `App` component | Mixed entry point with feature component | `App.jsx` is now a shell; builder is its own feature component |
| `index.css` was empty | Modal/ReactFlow styles only in `App.css` | Consolidated all global styles into `index.css` |

---

## 6. Old Files (To Be Deleted)

These files are superseded by the new structure. The app no longer imports from any of them.

```
src/App.css                              ← styles moved to src/index.css
src/module/DecisionNode.jsx              ← moved to features/workflow/nodes/
src/module/WorkflowNode.jsx              ← moved to features/workflow/nodes/
src/module/NodeDetails.jsx               ← moved to features/workflow/nodes/
src/module/HeaderConfiguration.jsx       ← moved to features/workflow/nodes/
src/module/ChatBot/ChatBot.jsx           ← moved to features/chatbot/
src/module/ChatBot/ChatBot.css           ← moved to features/chatbot/
src/module/apiConfig/ApiConfigList.jsx   ← moved to features/apiConfig/
src/module/apiConfig/ApiConfigForm.jsx   ← moved to features/apiConfig/
src/module/apiConfig/ApiConfigService.jsx ← moved to features/apiConfig/
src/module/workflow/WorkflowList.jsx     ← moved to features/workflow/
src/module/workflow/WorkflowForm.jsx     ← moved to features/workflow/
src/module/workflow/WorkflowService.jsx  ← moved to features/workflow/
src/module/layout/AppLayout.jsx         ← moved to src/layout/
src/module/routing/Routes.jsx           ← moved to src/router/
src/module/component/InputField.jsx     ← moved to src/components/
src/module/component/SelectComponent.jsx ← moved to src/components/
```

> **Note:** Do not delete these until you have confirmed the app builds and runs correctly with the new structure.

---

## 7. How to Run

### Development
```bash
cd chatbot_frontend
npm install
npm run dev
```
The dev server starts on `http://localhost:3000` and proxies all `/api` and `/ws` traffic to the backend at `http://localhost:8080`.

`.env.development` is loaded automatically and sets `VITE_WS_API_KEY=dev-api-key-12345`, which matches the backend's `application-dev.properties`.

### Production Build
```bash
npm run build
```
For a non-localhost backend, set environment variables before building:
```bash
VITE_API_BASE_URL=https://your-backend.com
VITE_WS_URL=https://your-backend.com/ws
VITE_WS_API_KEY=your-production-api-key
npm run build
```

### Environment Variables Reference

| Variable | Dev default | Description |
|----------|-------------|-------------|
| `VITE_API_BASE_URL` | `""` (empty) | REST API base URL. Empty = use Vite proxy. |
| `VITE_WS_URL` | `""` (empty) | WebSocket URL. Empty = use Vite proxy. |
| `VITE_WS_API_KEY` | `dev-api-key-12345` | API key sent as `X-API-Key` on STOMP CONNECT. Must match backend `websocket.api-key` property. |

### Backend `websocket.api-key` values by profile

| Profile | Key |
|---------|-----|
| `dev` | `dev-api-key-12345` |
| `staging` | `staging-api-key-67890` |
| `prod` | Set via `WEBSOCKET_API_KEY` env var on the server |

### Backend Requirements
| Service | Default |
|---------|---------|
| Spring Boot API | `http://localhost:8080` |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Backend CORS must allow `http://localhost:3000` (already configured in `application-dev.properties` via `cors.allowed-origins`).
