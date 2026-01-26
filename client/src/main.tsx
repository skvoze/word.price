alert("Приложение запускается!"); // Это выскочит сразу при открытии
console.log("Лог из main.tsx");
const tg = (window as any).Telegram?.WebApp;
console.log("=== ПРОВЕРКА TG ПРИ СТАРТЕ ===");
console.log("Весь объект WebApp:", tg);
console.log("Данные пользователя:", tg?.initDataUnsafe?.user);

if (tg) {
    tg.ready(); // Сообщаем Телеграму, что приложение готово
    tg.expand(); // Разворачиваем на весь экран для удобства
}
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
