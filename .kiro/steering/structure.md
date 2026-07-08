# Project Structure

```
src/
├── main.jsx                  # App entry point, router provider, global CSS imports
├── App.jsx                   # Workflow Builder page (ReactFlow canvas + node logic)
├── App.css                   # Styles for the builder
├── index.css                 # Global styles
├── module/
│   ├── layout/
│   │   └── AppLayout.jsx     # Shell layout with navbar + <Outlet>
│   ├── routing/
│   │   └── Routes.jsx        # All route definitions (createBrowserRouter)
│   ├── ChatBot/
│   │   ├── ChatBot.jsx       # Live chat preview (WebSocket client)
│   │   └── ChatBot.css
│   ├── workflow/
│   │   ├── WorkflowList.jsx  # Workflow CRUD list page
│   │   ├── WorkflowForm.jsx  # Workflow create/edit form
│   │   └── WorkflowService.jsx  # Axios service for /api/workflows
│   ├── apiConfig/
│   │   ├── ApiConfigList.jsx # API config CRUD list page
│   │   ├── ApiConfigForm.jsx # API config create/edit form
│   │   └── ApiConfigService.jsx  # Axios service for /api/api-configs
│   ├── component/
│   │   ├── InputField.jsx    # Reusable form input wrapper
│   │   └── SelectComponent.jsx   # Reusable dropdown wrapper
│   ├── DecisionNode.jsx      # Custom ReactFlow node (diamond decision)
│   ├── WorkflowNode.jsx      # Custom ReactFlow node (workflow link)
│   ├── NodeDetails.jsx       # Node settings panel (shown in modal)
│   └── HeaderConfiguration.jsx   # HTTP header config UI
```

## Conventions

- **File naming**: PascalCase for components (e.g. `WorkflowList.jsx`), camelCase for services (e.g. `WorkflowService.jsx`)
- **Component style**: Functional components with hooks; no class components
- **State management**: Local state with `useState`/`useReducer`; no global store (Redux/Zustand)
- **API services**: Thin axios wrapper objects exported from `*Service.jsx` files with standard CRUD methods (`getAll`, `getById`, `create`, `update`, `delete`)
- **Routing**: Flat route array in `Routes.jsx` using `createBrowserRouter`; all pages nest under `AppLayout`
- **Styling**: Mix of React Bootstrap components, inline styles, and CSS files; no CSS-in-JS or Tailwind
- **Custom ReactFlow nodes**: Defined as standalone components, registered in `nodeTypes` map in `App.jsx`
