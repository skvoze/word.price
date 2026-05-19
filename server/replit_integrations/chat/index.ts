import { Router } from "express";

const router = Router();


router.post("/", (req, res) => {
  res.status(501).json({ message: "Chat is disabled locally" });
});

export function registerChatRoutes(app: any) {
  app.use("/api/chat", router);
}

export default router;
