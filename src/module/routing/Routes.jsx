import { createBrowserRouter } from "react-router-dom";
import ChatBot from "../ChatBot/ChatBot";
import App from "../../App";
import AppLayout from "../layout/AppLayout";
import ApiConfigList from "../apiConfig/ApiConfigList";
import ApiConfigForm from "../apiConfig/ApiConfigForm";

const routes = createBrowserRouter([
    {
        element: <AppLayout />,
        children: [
            {
                path: "/",
                element: <App />,
            },
            {
                path: "/chatbot",
                element: <ChatBot />,
            },
            {
                path: "/api-configs",
                element: <ApiConfigList />,
            },
            {
                path: "/api-configs/new",
                element: <ApiConfigForm />,
            },
            {
                path: "/api-configs/edit/:id",
                element: <ApiConfigForm />,
            },
        ],
    },
]);

export default routes;
