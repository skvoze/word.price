import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "../server/storage";
import { api } from "@shared/routes";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const upload = multer({ storage: multer.memoryStorage() });

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userAddress = req.headers["x-user-address"] as string;
  if (!userAddress || userAddress === 'undefined' || userAddress === 'null' || userAddress.length < 20) {
    return res.status(401).json({ message: "Wallet connection required" });
  }

  const lowerAddress = userAddress.toLowerCase();

  try {
    let user = await storage.getUserByAddress(lowerAddress);
    
    if (!user) {
      try {
        user = await storage.createUser({ address: lowerAddress });
      } catch (createErr: any) {
        if (createErr.code === '23505') {
          user = await storage.getUserByAddress(lowerAddress);
        } else {
          throw createErr;
        }
      }
    }

    if (!user) return res.status(404).json({ message: "User profile not found" });

    (req as any).user = user;
    next();
  } catch (error: any) {
    console.error(`[Auth DB Error]: ${error.message}`);
    res.status(429).json({ message: "Database is temporarily busy" });
  }
}

function startDeadlineChecker() {
  setInterval(async () => {
    try {
      const allTasks = await storage.getTasks();
      const now = new Date();

      for (const task of allTasks) {
        try {
          if (task.status === "pending" && now > new Date(task.deadline)) {
            await storage.updateTaskStatus(task.id, "failed", "Deadline expired");
          }
          
          if (task.status === "submitted") {
            const submissionDate = new Date(task.updatedAt || task.createdAt);
            const hoursPassed = (now.getTime() - submissionDate.getTime()) / (1000 * 3600);
            if (hoursPassed >= 24) {
               await storage.updateUserBalance(task.userAddress, task.amount);
               await storage.updateTaskStatus(task.id, "completed");
            }
          }
        } catch (taskErr) {
          console.error(`[Deadline Task #${task.id} Error]:`, taskErr);
        }
      }
    } catch (err) {
      console.error("[Deadline Checker Global Error]:", err);
    }
  }, 30 * 60 * 1000); 
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  
  // --- UPLOADS ---
  app.post("/api/uploads/request-url", authMiddleware, async (req, res) => {
    try {
      const fileName = `evidence-${Date.now()}.jpg`;
      res.json({ uploadURL: "/api/uploads/direct", objectPath: fileName });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  app.post("/api/uploads/direct", authMiddleware, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await cloudinary.uploader.upload(dataURI, { resource_type: "auto" });
      res.json({ url: result.secure_url }); 
    } catch (error) {
      console.error("Cloudinary Error:", error);
      res.status(500).json({ message: "Failed to upload to Cloudinary" });
    }
  });

  // --- USER & TRANSACTIONS ---
  app.get(api.users.me.path, authMiddleware, async (req: any, res) => {
    res.json(req.user);
  });

  app.get("/api/transactions", authMiddleware, async (req: any, res) => {
    const history = await storage.getTransactionsByAddress(req.user.address);
    res.json(history);
  });

  app.post("/api/users/deposit", authMiddleware, async (req: any, res) => {
    const { amount, txHash } = req.body; 
    try {
      const updatedUser = await storage.updateUserBalance(req.user.address, parseFloat(amount));
      await storage.createTransaction({
        userAddress: req.user.address,
        amount: Math.round(parseFloat(amount) * 100),
        type: "deposit",
        status: "completed",
        description: `Deposit via tx: ${txHash.slice(0, 6)}...`
      });
      res.json(updatedUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // --- TASKS CORE ---
 app.post(api.tasks.create.path, authMiddleware, async (req: any, res) => {
    let moneyWasDeducted = false;
    const user = req.user;

    try {
      const taskData = insertTaskSchema.parse(req.body);
      // УБРАНО /100: работаем в целых числах (копейках) как в базе
      const cost = taskData.amount; 

      if (user.balance < cost) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Пытаемся списать баланс
      await storage.updateUserBalance(user.address, -cost);
      moneyWasDeducted = true;

      // Создаем задачу
      const task = await storage.createTask({ ...taskData, userAddress: user.address });
      res.status(201).json(task);

    } catch (err: any) {
      console.error("[Create Task Error]:", err.message);
      if (moneyWasDeducted) {
        try {
          const taskData = req.body;
          await storage.updateUserBalance(user.address, taskData.amount);
        } catch (restoreErr) {
          console.error("CRITICAL: Failed to restore balance!", restoreErr);
        }
      }

      res.status(503).json({ message: "Database is busy. Please try again." });
    }
  });

 app.get(api.tasks.list.path, authMiddleware, async (req: any, res) => {
    try {
      const tasks = req.user.role === "admin" 
        ? await storage.getTasks() 
        : await storage.getTasksByUser(req.user.address);
      res.json(tasks);
    } catch (error) {
      console.error("[Tasks List Error]:", error);
      res.status(503).json({ message: "Database connection lost. Try again." });
    }
  });

  app.get("/api/admin/tasks", authMiddleware, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") return res.sendStatus(403);
      const allTasks = await storage.getTasks();
      const submittedTasks = allTasks.filter(t => t.status === "submitted");
      res.json(submittedTasks);
    } catch (error) {
      console.error("[Admin Tasks Error]:", error);
      res.status(503).json({ message: "Database busy. Please refresh." });
    }
  });

  app.post(api.tasks.submitEvidence.path, authMiddleware, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { evidenceUrl } = req.body;
      if (!evidenceUrl) return res.status(400).json({ message: "evidenceUrl is required" });
      const task = await storage.submitEvidence(id, evidenceUrl);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (err: any) {
      res.status(400).json({ message: "Upload failed" });
    }
  });
app.post(api.tasks.fail.path, authMiddleware, async (req: any, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

  try {
    const id = Number(req.params.id);
    const { rejectionReason } = req.body;

    // Пытаемся получить задачу быстро
    const task = await storage.getTask(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const bonusDeadline = new Date();
    bonusDeadline.setHours(bonusDeadline.getHours() + 24);
    
    const currentDeadline = new Date(task.deadline);
    const finalDeadline = bonusDeadline > currentDeadline ? bonusDeadline : currentDeadline;

    // ОБНОВЛЯЕМ: добавляем true в конце, чтобы очистить старый пруф (твой storage это умеет)
    const updated = await storage.updateTaskStatus(
      id, 
      "failed", 
      rejectionReason, 
      finalDeadline,
      true
    );     

    res.json(updated);
  } catch (err: any) {
    console.error("[Task Fail Error]:", err.message);
    res.status(503).json({ message: "Database busy. Please try again." });
  }
});
 app.post("/api/admin/tasks/:id/approve", authMiddleware, async (req: any, res) => {
  if (req.user.role !== "admin") return res.sendStatus(403);
  
  const id = Number(req.params.id);
  
  try {
    const task = await storage.getTask(id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.status === "completed") return res.json({ success: true });
    const workerAddress = task.userAddress.toLowerCase();
    await Promise.all([
      storage.createTransaction({
        userAddress: workerAddress,
        amount: Math.round(task.amount), 
        type: "refund",
        status: "completed",
        description: `Task approved: ${task.title}`
      }),
      storage.updateTaskStatus(id, "completed")
    ]);
    await storage.updateUserBalance(workerAddress, task.amount); 
    
    res.json({ success: true });
  } catch (err) {
    console.error("Approve failed:", err);
    res.status(503).json({ message: "Database connection lost. Try again." });
  }
});

 
  app.get("/api/tasks/:id", authMiddleware, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid task ID" });
      const task = await storage.getTask(id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      if (task.userAddress !== req.user.address && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(task);
    } catch (error) {
      res.status(503).json({ message: "Database busy" });
    }
  });

  startDeadlineChecker();
  return httpServer;
}