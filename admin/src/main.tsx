import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./app/theme/reset.css";
import "./app/theme/global.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
