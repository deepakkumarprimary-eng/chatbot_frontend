import { createBrowserRouter } from "react-router-dom";
import AppLayout       from "../layout/AppLayout";
import WorkflowList    from "../features/workflow/WorkflowList";
import WorkflowForm    from "../features/workflow/WorkflowForm";
import WorkflowBuilder from "../features/workflow/WorkflowBuilder";
import ApiConfigList   from "../features/apiConfig/ApiConfigList";
import ApiConfigForm   from "../features/apiConfig/ApiConfigForm";
import ChatBot         from "../features/chatbot/ChatBot";

const routes = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/",                       element: <WorkflowList /> },
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
