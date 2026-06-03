import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "../server/storage";
import { api } from "@shared/routes";
import { insertTaskSchema } from "@shared/schema";
import { lockUserFunds, unlockUserFunds, slashUserFunds, getVaultBalance } from "../shared/blockchain";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });
const userCache = new Map<string, { user: any, expires: number }>();
const CACHE_TTL = 10 * 60 * 1000;

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userAddress = req.headers["x-user-address"] as string;
  if (!userAddress || userAddress === 'undefined' || userAddress === 'null' || userAddress.length < 20) {
    return res.status(401).json({ message: "Wallet connection required" });
  }

  const lowerAddress = userAddress.toLowerCase();
  const cachedData = userCache.get(lowerAddress);
  if (cachedData && cachedData.expires > Date.now()) {
    (req as any).user = cachedData.user;
    return next();
  }

  try {
    let user = await storage.getUserByAddress(lowerAddress);
    
    if (!user) {
      user = {
        address: lowerAddress,
        role: "user",
        createdAt: new Date()
      };
    }

    userCache.set(lowerAddress, { user, expires: Date.now() + CACHE_TTL });
    (req as any).user = user;
    next();
  } catch (error: any) {
    console.error(`[Auth DB Error]: ${error.message}`);
    if (cachedData) {
      (req as any).user = cachedData.user;
      return next();
    }
    res.status(503).json({ message: "Database busy" });
  }
}

function startDeadlineChecker() {
  setInterval(async () => {
    try {
      const now = new Date();
      const bufferTime = new Date(now.getTime() + 60000); 
      const tasksToProcess = await storage.getTasksForDeadlineCheck(bufferTime);
      if (tasksToProcess.length === 0) return;

      for (const task of tasksToProcess) {
        if (task.status === "completed") continue;
        const deadlineDate = new Date(task.deadline);  
        const isExpired = bufferTime > deadlineDate;
        const taskChainId = task.chainId || 8453; 
        
        try {
          if ((task.status === "pending" || task.status === "failed") && isExpired) {
            const userHistory = await storage.getTransactionsByAddress(task.userAddress);
            const alreadySlashedInChain = userHistory.some(tx => 
              tx.type === "slash" && 
              tx.description?.includes(task.title) && 
              tx.status === "completed" &&
              tx.chainId === taskChainId
            );

            if (alreadySlashedInChain) {
              if (task.status !== "failed") {
                await storage.updateTaskStatus(task.id, "failed", "Deadline expired (Sync)");
              }
              continue;
            }
            
            console.log(`[Deadline] Slashing funds for task #${task.id} on chain ${taskChainId}`);
            const receipt = await slashUserFunds(task.userAddress, task.amount, taskChainId);
            const txHash = receipt.transactionHash;

            await storage.updateTaskStatus(task.id, "failed", "Final deadline expired (Funds slashed)");
            
            await storage.createTransaction({
              userAddress: task.userAddress,
              amount: task.amount,
              type: "slash", 
              status: "completed",
              description: `Deadline expired: ${task.title}`,
              txHash: txHash,
              chainId: taskChainId
            });
            
            userCache.delete(task.userAddress.toLowerCase());
          }
          
          if (task.status === "submitted") {
            const submissionDate = new Date(task.updatedAt || task.createdAt || now);
            const msPassed = now.getTime() - submissionDate.getTime();
            if (msPassed >= (24 * 3600 * 1000 - 60000)) { 
              console.log(`[Deadline] Auto-approving task #${task.id} on chain ${taskChainId}`);
              const receipt = await unlockUserFunds(task.userAddress, task.amount, taskChainId);
              const txHash = receipt.transactionHash;
              
              await storage.updateTaskStatus(task.id, "completed");
              
              await storage.createTransaction({
                userAddress: task.userAddress,
                amount: task.amount,
                type: "refund",
                status: "completed",
                description: `Auto-approved (no admin review): ${task.title}`,
                txHash: txHash,
                chainId: taskChainId
              });

              userCache.delete(task.userAddress.toLowerCase());
            }
          }
        } catch (taskErr) {
          console.error(`[Deadline Task #${task.id} Error on chain ${taskChainId}]:`, taskErr);
        }
      }
    } catch (err) {
      console.error("[Deadline Checker Global Error]:", err);
    }
  }, 8 * 60 * 1000);
}

async function sendTelegramNotification(telegramId: string, message: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN || !telegramId) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramId, text: message, parse_mode: 'HTML' })
    });
  } catch (e) { console.error("[TG Notification Error]:", e); }
}

async function notifyAdmins(message: string) {
  const admin = process.env.ADMIN_TELEGRAM_ID||""; 
  try { await sendTelegramNotification(admin, message); } catch (e) { console.error("[Notify Admin Error]:", e); }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  
  // --- UPLOADS 
  app.post("/api/uploads/request-url", authMiddleware, async (req, res) => {
    try {
      res.json({ uploadURL: "/api/uploads/direct", objectPath: `evidence-${Date.now()}.jpg` });
    } catch (error) { res.status(500).json({ message: "Failed to generate upload URL" }); }
  });

  app.post("/api/uploads/direct", authMiddleware, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      const result = await cloudinary.uploader.upload(dataURI, { resource_type: "auto" });
      res.json({ url: result.secure_url }); 
    } catch (error) { res.status(500).json({ message: "Failed to upload to Cloudinary" }); }
  });

  app.get(api.users.me.path, authMiddleware, async (req: any, res) => {
  const lowerAddress = req.user.address.toLowerCase();
  const currentChainId = parseInt((req.query.chainId as string) || "8453");
  
  const dbUser = await storage.getUserByAddress(lowerAddress);
  const userObject = dbUser || req.user;

  try {
    const realBalanceUnits = await getVaultBalance(lowerAddress, currentChainId);
    const realBalanceInCents = Math.round(realBalanceUnits * 100);
    return res.json({
      ...userObject,
      balance: realBalanceInCents
    });
  } catch (error) {
    console.error(`[RPC Balance Error] Failed to read chain ${currentChainId}:`, error);
    return res.json({
      ...dbUser,
      balance: 0
    });
  }
});

  app.get("/api/transactions", authMiddleware, async (req: any, res) => {
    const chainId = parseInt((req.query.chainId as string) || "8453");
    const history = await storage.getTransactionsByAddress(req.user.address);
    res.json(history.filter((tx: any) => tx.chainId === chainId));
  });

  app.post("/api/users/deposit", authMiddleware, async (req: any, res) => {
    const { amount, txHash, chainId } = req.body; 
    const lowerAddress = req.user.address.toLowerCase();
    const targetChainId = parseInt(chainId || "8453");

    try {
      const amountInCents = Math.round(parseFloat(amount) * 100);
      let dbUser = await storage.getUserByAddress(lowerAddress);
      if (!dbUser) {
        dbUser = await storage.createUser({ address: lowerAddress });
      }

      userCache.delete(lowerAddress);

      await storage.createTransaction({
        userAddress: lowerAddress,
        amount: amountInCents,
        type: "deposit",
        status: "completed",
        description: `Deposit via tx: ${txHash.slice(0, 6)}...`,
        chainId: targetChainId 
      });

      let blockchainBalanceUnits = 0;
      try {
        blockchainBalanceUnits = await getVaultBalance(lowerAddress, targetChainId);
      } catch (e) {
        blockchainBalanceUnits = parseFloat(amount);
      }

      res.json({
        ...dbUser,
        balance: Math.round(blockchainBalanceUnits * 100)
      });
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });

 app.post("/api/users/withdraw", authMiddleware, async (req: any, res) => {
    const { amount, txHash, chainId } = req.body; 
    const user = req.user;
    const targetChainId = parseInt(chainId || "8453");

    try {
      const dbUser = await storage.getUserByAddress(user.address);
      if (!dbUser) return res.status(400).json({ message: "User not found" });
      if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ message: "Invalid amount" });

      const amountInCents = Math.round(parseFloat(amount) * 100);

      let blockchainBalanceUnits = 0;
      try {
        blockchainBalanceUnits = await getVaultBalance(user.address.toLowerCase(), targetChainId);
      } catch (rpcErr) {
        return res.status(503).json({ message: "RPC Node unavailable. Could not verify balance." });
      }
      const blockchainBalanceCents = Math.round(blockchainBalanceUnits * 100);

      const tasks = await storage.getTasksByUser(user.address);
      const activeTasks = tasks.filter(t => 
        (t.status === "pending" || t.status === "submitted" || t.status === "failed") && 
        new Date(t.deadline) > new Date() && 
        (t.chainId === targetChainId)
      );
      
      const totalLockedCents = activeTasks.reduce((sum, t) => sum + Number(t.amount), 0);
      const withdrawableCents = blockchainBalanceCents - totalLockedCents;

      if (withdrawableCents < amountInCents) {
        return res.status(400).json({ 
          message: `Insufficient withdrawable balance. Available: ${(withdrawableCents / 100).toFixed(2)} USDC (Locked in tasks: ${(totalLockedCents / 100).toFixed(2)} USDC)` 
        });
      }

      userCache.delete(user.address.toLowerCase());
      
      await storage.createTransaction({
        userAddress: user.address,
        amount: amountInCents,
        type: "withdraw",
        status: "completed",
        description: `Withdrawal to wallet: ${amount} USDC`,
        txHash: txHash || null,
        chainId: targetChainId
      });

      res.json({
        ...dbUser,
        balance: blockchainBalanceCents - amountInCents
      });
    } catch (err: any) { 
      console.error("[Withdraw Error]:", err);
      res.status(500).json({ message: "Failed to process withdrawal" }); 
    }
  });

  app.post(api.tasks.create.path, authMiddleware, async (req: any, res) => {
    const userAddress = req.user.address.toLowerCase();
    try {
      const user = await storage.getUserByAddress(userAddress);
      const targetChainId = req.body.chainId ? parseInt(req.body.chainId) : 8453;

      const taskData = insertTaskSchema.parse({
        ...req.body,
        amount: Number(req.body.amount) 
      });

      const costCents = Number(taskData.amount); 

      let blockchainBalanceUnits = 0;
      try {
        blockchainBalanceUnits = await getVaultBalance(userAddress, targetChainId);
      } catch (blockchainReadError) {
        console.error(`[Create Task] Failed to read balance from chain ${targetChainId}:`, blockchainReadError);
        return res.status(503).json({ message: "Failed to verify wallet balance via RPC. Try again later." });
      }

      const blockchainBalanceCents = Math.round(blockchainBalanceUnits * 100);

      if (!user || blockchainBalanceCents < costCents) {
        return res.status(400).json({ 
          message: `Insufficient balance on chain ${targetChainId}. Available: ${blockchainBalanceUnits.toFixed(2)} USDC` 
        });
      }

      console.log(`[Create Task] Invoking blockchain lock on chain ${targetChainId} for ${user.address}, amount cents: ${costCents}`);
      let txHash: `0x${string}`;
      try {
        const receipt = await lockUserFunds(user.address, costCents, targetChainId);
        txHash = receipt.transactionHash;
      } catch (blockchainError: any) {
        console.error("[Create Task - Blockchain TX Failed]:", blockchainError);
        return res.status(502).json({ 
          message: `Blockchain transaction failed: ${blockchainError.message || "Unknown RPC error"}` 
        });
      }

      const task = await storage.createTask({ 
        ...taskData, 
        userAddress: user.address, 
        chainId: targetChainId 
      });
      
      await storage.createTransaction({
        userAddress: user.address,
        amount: costCents,
        type: "lock",
        status: "completed",
        description: `Locked for task: ${task.title}`,
        txHash: txHash,
        chainId: targetChainId
      });

      userCache.delete(userAddress);
      return res.status(201).json(task);

    } catch (err: any) {
      console.error("[Create Task Internal Error]:", err);
      if (err.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input data", errors: err.errors });
      }
      return res.status(500).json({ message: "Internal server error or database busy." });
    }
  });

  app.get(api.tasks.list.path, authMiddleware, async (req: any, res) => {
    try {
      const chainId = parseInt((req.query.chainId as string) || "8453");
      const allTasks = req.user.role === "admin" 
        ? await storage.getTasks() 
        : await storage.getTasksByUser(req.user.address);
      res.json(allTasks.filter((t: any) => (t.chainId || 8453) === chainId));
    } catch (error) { res.status(503).json({ message: "Database connection lost." }); }
  });

  app.post(api.tasks.submitEvidence.path, authMiddleware, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { evidenceUrl } = req.body;
      if (!evidenceUrl) return res.status(400).json({ message: "evidenceUrl is required" });
      const task = await storage.submitEvidence(id, evidenceUrl);
      if (!task) return res.status(404).json({ message: "Task not found" });

      const adminMessage = 
        `<b>📦 New verify!</b>\n\n` +
        `📝 Task #${task.id}: <b>${task.title}</b>\n` +
        `👤 User: <pre>${task.userAddress}</pre>\n` +
        `💰 Amount: ${task.amount / 100} USDC\n\n` +
        `🔗 <a href="${evidenceUrl}">Open proof</a>`;

      await notifyAdmins(adminMessage);
      res.json(task);
    } catch (err: any) { res.status(400).json({ message: "Upload failed" }); }
  });

  // --- ADMIN ACTIONS 
  app.get("/api/admin/tasks", authMiddleware, async (req: any, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const allTasks = await storage.getTasks();
    res.json(allTasks.filter(t => t.status === "submitted"));
  });

  app.post(api.tasks.fail.path, authMiddleware, async (req: any, res) => {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
    try {
      const id = Number(req.params.id);
      const { rejectionReason } = req.body;
      const task = await storage.getTask(id);
      if (!task) return res.status(404).json({ message: "Task not found" });

      const bonusDeadline = new Date();
      bonusDeadline.setHours(bonusDeadline.getHours() + 24);
      const finalDeadline = bonusDeadline > new Date(task.deadline) ? bonusDeadline : new Date(task.deadline);
      
      const updated = await storage.updateTaskStatus(id, "failed", rejectionReason, finalDeadline, true);     
      res.json(updated);
    } catch (err: any) { res.status(503).json({ message: "Database busy." }); }
  });

  app.post("/api/admin/tasks/:id/approve", authMiddleware, async (req: any, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const id = Number(req.params.id);
    try {
      const task = await storage.getTask(id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      if (task.status === "completed") return res.json({ success: true });

      const workerAddress = task.userAddress.toLowerCase();
      const taskChainId = task.chainId || 8453;

      console.log(`[Admin Approve] Releasing locked funds on chain ${taskChainId}`);
      const receipt = await unlockUserFunds(workerAddress, task.amount, taskChainId);
      const txHash = receipt.transactionHash;

      await storage.updateTaskStatus(id, "completed");
      
      await storage.createTransaction({
        userAddress: workerAddress,
        amount: Math.round(task.amount), 
        type: "refund",
        status: "completed",
        description: `Task approved: ${task.title}`,
        txHash: txHash,
        chainId: taskChainId
      });
      userCache.delete(workerAddress);
      res.json({ success: true });
    } catch (err) { res.status(503).json({ message: "Blockchain error." }); }
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
    } catch (error) { res.status(503).json({ message: "Database busy" }); }
  });

  startDeadlineChecker();
  return httpServer;
}