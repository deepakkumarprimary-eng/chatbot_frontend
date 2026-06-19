import { createBrowserRouter } from "react-router-dom";
import ChatBot from "../ChatBot/ChatBot";
import App from "../../App";



const routes = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/chatbot",
        element: <ChatBot />,
    }
]);
export default routes;