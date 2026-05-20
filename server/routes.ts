import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "../server/storage";
import { api } from "@shared/routes";
import { insertTaskSchema } from "@shared/schema";
import { lockUserFunds, unlockUserFunds, slashUserFunds } from "../shared/blockchain";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { getVaultBalance } from "../shared/blockchain";
import { VAULT_ADDRESS } from "../shared/contracts";

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
        balance: "0.00",
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
        
        try {
          if ((task.status === "pending" || task.status === "failed") && isExpired) {
            const userHistory = await storage.getTransactionsByAddress(task.userAddress);
            const alreadySlashedInChain = userHistory.some(tx => 
              tx.type === "slash" && 
              tx.description?.includes(task.title) && 
              tx.status === "completed"
            );

            if (alreadySlashedInChain) {
              if (task.status !== "failed") {
                await storage.updateTaskStatus(task.id, "failed", "Deadline expired (Sync)");
              }
              continue;
            }
            
            // Защита: Слэшинг вызываем только если таска была на Base Mainnet
            let txHash = "0x_arc_testnet_slash_placeholder";
            if (task.chainId === 8453) {
              console.log(`[Deadline] Slashing funds for task #${task.id} on Base`);
              const receipt = await slashUserFunds(task.userAddress, task.amount);
              txHash = receipt.transactionHash;
            } else {
              console.log(`[Deadline] Simulating Arc Testnet Slash for task #${task.id}`);
            }

            await storage.updateTaskStatus(task.id, "failed", "Final deadline expired (Funds slashed)");
            
            await storage.createTransaction({
              userAddress: task.userAddress,
              amount: task.amount,
              type: "slash", 
              status: "completed",
              description: `Deadline expired: ${task.title}`,
              txHash: txHash,
              chainId: task.chainId
            });
            
            userCache.delete(task.userAddress.toLowerCase());
          }
          
          if (task.status === "submitted") {
            const submissionDate = new Date(task.updatedAt || task.createdAt || now);
            const msPassed = now.getTime() - submissionDate.getTime();
            if (msPassed >= (24 * 3600 * 1000 - 60000)) { 
              console.log(`[Deadline] Auto-approving task #${task.id}`);
              
              let txHash = "0x_arc_testnet_refund_placeholder";
              if (task.chainId === 8453) {
                const receipt = await unlockUserFunds(task.userAddress, task.amount);
                txHash = receipt.transactionHash;
              }
              
              await storage.updateUserBalance(task.userAddress, task.amount);
              await storage.updateTaskStatus(task.id, "completed");
              
              await storage.createTransaction({
                userAddress: task.userAddress,
                amount: task.amount,
                type: "refund",
                status: "completed",
                description: `Auto-approved (no admin review): ${task.title}`,
                txHash: txHash,
                chainId: task.chainId
              });

              userCache.delete(task.userAddress.toLowerCase());
            }
          }
        } catch (taskErr) {
          console.error(`[Deadline Task #${task.id} Error]:`, taskErr);
        }
      }
    } catch (err) {
      console.error("[Deadline Checker Global Error]:", err);
    }
  }, 8 * 60 * 1000);
}

// ... Вспомогательные функции отправки уведомлений остаются без изменений ...
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
  
  // --- UPLOADS (БЕЗ ИЗМЕНЕНИЙ) ---
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

  // --- USER ME (ИСПРАВЛЕНО: СИНК ТОЛЬКО НА BASE MAINNET) ---
  app.get(api.users.me.path, authMiddleware, async (req: any, res) => {
    const lowerAddress = req.user.address.toLowerCase();
    const currentChainId = parseInt((req.query.chainId as string) || "8453");
    
    const dbUser = await storage.getUserByAddress(lowerAddress);
    if (!dbUser) return res.json(req.user);

    // Сверяем баланс с контрактом только если мы на Base Mainnet
    if (currentChainId === 8453) {
      try {
        const realBalanceUnits = await getVaultBalance(lowerAddress);
        const realBalanceInCents = Math.round(realBalanceUnits * 100);
        const currentDbBalance = Number(dbUser.balance);
        
        if (currentDbBalance !== realBalanceInCents) {
          const updatedUser = await storage.updateUserBalance(lowerAddress, realBalanceInCents - currentDbBalance);
          userCache.set(lowerAddress, { user: updatedUser, expires: Date.now() + CACHE_TTL });
          return res.json(updatedUser);
        }
      } catch (error) {
        console.error("[Sync Skip] Using DB fallback:", error);
      }
    }
    res.json(dbUser);
  });

  app.get("/api/transactions", authMiddleware, async (req: any, res) => {
    const chainId = parseInt((req.query.chainId as string) || "8453");
    const history = await storage.getTransactionsByAddress(req.user.address);
    res.json(history.filter((tx: any) => tx.chainId === chainId));
  });

  // --- ДЕПОЗИТ (БЕЗ ИЗМЕНЕНИЙ) ---
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

      const updatedUser = await storage.updateUserBalance(lowerAddress, amountInCents);
      userCache.delete(lowerAddress);

      await storage.createTransaction({
        userAddress: lowerAddress,
        amount: amountInCents,
        type: "deposit",
        status: "completed",
        description: `Deposit via tx: ${txHash.slice(0, 6)}...`,
        chainId: targetChainId
      });

      res.json(updatedUser);
    } catch (err: any) { res.status(400).json({ message: err.message }); }
  });

  // --- ВЫВОД (ИСПРАВЛЕНО: ДОБАВЛЕН CHAIN_ID) ---
  app.post("/api/users/withdraw", authMiddleware, async (req: any, res) => {
    const { amount, txHash, chainId } = req.body; 
    const user = req.user;
    const targetChainId = parseInt(chainId || "8453");

    try {
      const dbUser = await storage.getUserByAddress(user.address);
      if (!dbUser) return res.status(400).json({ message: "User has no funds to withdraw" });
      if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ message: "Invalid amount" });

      const amountInCents = Math.round(parseFloat(amount) * 100);
      const tasks = await storage.getTasksByUser(user.address);
      const activeTasks = tasks.filter(t => 
        (t.status === "pending" || t.status === "submitted" || t.status === "failed") && 
        new Date(t.deadline) > new Date() && t.chainId === targetChainId // Фильтр по чейну при выводе
      );
      
      const totalLocked = activeTasks.reduce((sum, t) => sum + Number(t.amount), 0);
      if (Number(dbUser.balance) - totalLocked < amountInCents) {
        return res.status(400).json({ 
          message: "Insufficient withdrawable balance. Some funds are locked in active challenges." 
        });
      }

      const updatedUser = await storage.updateUserBalance(user.address, -amountInCents);
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

      res.json(updatedUser);
    } catch (err: any) { res.status(500).json({ message: "Failed to process withdrawal" }); }
  });

  // --- TASKS CORE (ИСПРАВЛЕНО: ЗАЩИТА БЛОКЧЕЙН ВЫЗОВА) ---
  app.post(api.tasks.create.path, authMiddleware, async (req: any, res) => {
    const userAddress = req.user.address.toLowerCase();
    try {
      const user = await storage.getUserByAddress(userAddress);
      if (!user) return res.status(404).json({ message: "User not found. Please deposit first." });

      const taskData = insertTaskSchema.parse(req.body);
      const cost = Number(taskData.amount);
      const userBalance = Number(user.balance);

      if (userBalance < cost) return res.status(400).json({ message: `Insufficient balance.` });

      const targetChainId = taskData.chainId || 8453;
      let txHash = "0x_arc_testnet_lock_placeholder";

      // Дёргаем контракт Base ТОЛЬКО если это транзакции Base чейна
      if (targetChainId === 8453) {
        const receipt = await lockUserFunds(user.address, cost);
        txHash = receipt.transactionHash;
      }

      await storage.updateUserBalance(user.address, -cost);
      const task = await storage.createTask({ ...taskData, userAddress: user.address, chainId: targetChainId });
      
      await storage.createTransaction({
        userAddress: user.address,
        amount: cost,
        type: "lock",
        status: "completed",
        description: `Locked for task: ${task.title}`,
        txHash: txHash,
        chainId: targetChainId
      });

      userCache.delete(userAddress);
      res.status(201).json(task);
    } catch (err: any) {
      console.error("[Create Task Error]:", err.message);
      res.status(503).json({ message: "Blockchain failed or database busy." });
    }
  });

  app.get(api.tasks.list.path, authMiddleware, async (req: any, res) => {
    try {
      const chainId = parseInt((req.query.chainId as string) || "8453");
      const allTasks = req.user.role === "admin" 
        ? await storage.getTasks() 
        : await storage.getTasksByUser(req.user.address);
      
      res.json(allTasks.filter((t: any) => t.chainId === chainId));
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

  // --- ADMIN ACTIONS (ИСПРАВЛЕНО: ЗАЩИТА ТРАНЗАКЦИЙ ПРИ APPROVE) ---
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
      let txHash = "0x_arc_testnet_approve_placeholder";

      // Снятие средств с контракта вызываем только для Base
      if (task.chainId === 8453) {
        await unlockUserFunds(workerAddress, task.amount);
        txHash = "0x_base_mainnet_success_hash"; // Сюда можно прокинуть реальный хэш анлока
      }

      await storage.updateUserBalance(workerAddress, task.amount);
      await storage.updateTaskStatus(id, "completed");
      
      await storage.createTransaction({
        userAddress: workerAddress,
        amount: Math.round(task.amount), 
        type: "refund",
        status: "completed",
        description: `Task approved: ${task.title}`,
        txHash: txHash,
        chainId: task.chainId
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