import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query"; 
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

const tg = (window as any).Telegram?.WebApp;

const initApp = () => {
  if (tg) {
    tg.ready();
    tg.expand();
  }

  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
};

if (tg) {
  initApp();
} else {
  window.addEventListener('load', initApp);
}