import { Router } from "express";

const router = Router();


router.post("/", (req, res) => {
  res.status(501).json({ message: "AI features are disabled locally" });
});

export default router;