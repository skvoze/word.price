if (localStorage.getItem("testTelegramId") === "demo_user_123") {
    localStorage.removeItem("testTelegramId");
}
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
