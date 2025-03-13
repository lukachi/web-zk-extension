import React from "react";
import ReactDOM from "react-dom/client";
import {createRouter} from "./routes";
import {RouterProvider} from "react-router-dom";

const router = createRouter()

ReactDOM.createRoot(document.body).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
