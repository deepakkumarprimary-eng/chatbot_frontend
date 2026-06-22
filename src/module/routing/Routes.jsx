import { createBrowserRouter } from "react-router-dom";
import ChatBot from "../ChatBot/ChatBot";
import App from "../../App";
import AppLayout from "../layout/AppLayout";
import ApiConfigList from "../apiConfig/ApiConfigList";
import ApiConfigForm from "../apiConfig/ApiConfigForm";
import WorkflowList from "../workflow/WorkflowList";
import WorkflowForm from "../workflow/WorkflowForm";

const routes = createBrowserRouter([
    {
        element: <AppLayout />,
        children: [
            { path: "/",                       element: <App /> },
            { path: "/chatbot",                element: <ChatBot /> },
            { path: "/api-configs",            element: <ApiConfigList /> },
            { path: "/api-configs/new",        element: <ApiConfigForm /> },
            { path: "/api-configs/edit/:id",   element: <ApiConfigForm /> },
            { path: "/workflows",              element: <WorkflowList /> },
            { path: "/workflows/new",          element: <WorkflowForm /> },
            { path: "/workflows/edit/:id",     element: <WorkflowForm /> },
        ],
    },
]);

export default routes;
