
const tg = (window as any).Telegram?.WebApp;
if (tg) {
    tg.ready(); // Сообщаем Телеграму, что приложение готово
    tg.expand(); // Разворачиваем на весь экран для удобства
}
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
