import { createBrowserRouter } from "react-router-dom";
import WorkflowList    from "../features/workflow/WorkflowList";
import WorkflowForm    from "../features/workflow/WorkflowForm";
import WorkflowBuilder from "../features/workflow/WorkflowBuilder";
import ApiConfigList   from "../features/apiConfig/ApiConfigList";
import ApiConfigForm   from "../features/apiConfig/ApiConfigForm";
import ChatBot         from "../features/chatbot/ChatBot";
import App from "../App";

const routes = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/",                       element: <WorkflowBuilder /> },
      { path: "/workflows",              element: <WorkflowList /> },
      { path: "/workflows/new",          element: <WorkflowForm /> },
      { path: "/workflows/edit/:id",     element: <WorkflowForm /> },
      { path: "/builder",                element: <WorkflowBuilder /> },
      { path: "/builder/edit/:id",       element: <WorkflowBuilder /> },
      { path: "/api-configs",            element: <ApiConfigList /> },
      { path: "/api-configs/new",        element: <ApiConfigForm /> },
      { path: "/api-configs/edit/:id",   element: <ApiConfigForm /> },
      { path: "/chatbot",                element: <ChatBot /> },
    ],
  },
]);

export default routes;
