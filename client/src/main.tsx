alert("Приложение запускается!"); // Это выскочит сразу при открытии
console.log("Лог из main.tsx");
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
