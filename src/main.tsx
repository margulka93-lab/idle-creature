import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./ui/App";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
