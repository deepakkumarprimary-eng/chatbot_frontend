import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { RouterProvider } from 'react-router-dom';
import routes from './module/routing/Routes.jsx';
globalThis.global = globalThis;
createRoot(document.getElementById('root')).render(

    <RouterProvider router={routes} >
<StrictMode>
    <App />
</StrictMode>
  </RouterProvider>
  
 ,
)
