import { Buffer } from "buffer";
window.Buffer = Buffer;
window.global = window;
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query"; 
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);