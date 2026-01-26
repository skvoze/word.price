import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
const tg = (window as any).Telegram?.WebApp;

const initApp = () => {
  if (tg) {
    tg.ready();
    tg.expand();
  }
createRoot(document.getElementById("root")!).render(<App />);
};
if (tg) {
  initApp();
} else {
  // На случай если скрипт грузится медленно
  window.addEventListener('load', initApp);
}