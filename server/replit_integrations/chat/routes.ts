import { Router } from "express";

const router = Router();

// Заглушка: теперь этот роут просто отвечает, что чат отключен
router.post("/", (req, res) => {
  res.status(501).json({ message: "AI features are disabled locally" });
});

export default router;