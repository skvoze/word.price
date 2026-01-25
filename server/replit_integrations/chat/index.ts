import { Router } from "express";

const router = Router();

// Заглушка для роутов
router.post("/", (req, res) => {
  res.status(501).json({ message: "Chat is disabled locally" });
});

// Тот самый экспорт, который требует сервер
export function registerChatRoutes(app: any) {
  app.use("/api/chat", router);
}

export default router;
