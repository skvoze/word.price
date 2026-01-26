localStorage.removeItem("testTelegramId");
const tg = (window as any).Telegram?.WebApp;
if (tg) {
    tg.ready(); // Сообщаем Телеграму, что приложение готово
    tg.expand(); // Разворачиваем на весь экран для удобства
}
if (localStorage.getItem("testTelegramId")) {
    alert("Удаляю старый ID из памяти...");
    localStorage.removeItem("testTelegramId");
    window.location.reload(); // Перезагружаем страницу после удаления
}
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
