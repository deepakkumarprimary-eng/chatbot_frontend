# Product Overview

Chatbot Studio is a visual chatbot builder that lets users design conversational workflows using a drag-and-drop node-based editor. Users create workflow graphs (states, decisions, API calls, input prompts), configure API integrations, and preview the chatbot in a live WebSocket-powered chat interface.

## Core Capabilities

- **Workflow Builder**: Visual flow editor (ReactFlow) for designing conversation graphs with state nodes, decision branches, workflow links, and API nodes
- **API Configuration**: CRUD management of external API integrations that nodes can invoke during conversations
- **Chatbot Preview**: Live chat interface that connects via WebSocket (STOMP/SockJS) to a backend engine executing the workflows
- **Workflow Management**: List, create, edit, and delete saved workflows

## Backend

The frontend communicates with a Spring Boot backend at `http://localhost:8080`. API base paths:
- `/api/workflows` — workflow CRUD
- `/api/api-configs` — API configuration CRUD
- `/ws` — WebSocket endpoint for real-time chat
