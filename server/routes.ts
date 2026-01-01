import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Register integrations
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerObjectStorageRoutes(app);

  // --- Users API ---
  
  // Get or create user from Telegram Mini App context
  // In Telegram Mini App, window.Telegram.WebApp.initData contains user info
  app.get(api.users.me.path, async (req, res) => {
    // Get Telegram ID from header or use demo for testing
    const telegramId = req.headers["x-telegram-id"] as string || "demo_user_123";
    
    let user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      user = await storage.createUser({ telegramId });
    }
    res.json(user);
  });

  app.post(api.users.addFunds.path, async (req, res) => {
    const telegramId = req.headers["x-telegram-id"] as string || "demo_user_123";
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) return res.status(404).json({ message: "User not found" });

    try {
      const { amount } = api.users.addFunds.input.parse(req.body);
      const updatedUser = await storage.updateUserBalance(user.id, amount);
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.users.setRole.path, async (req, res) => {
    const telegramId = req.headers["x-telegram-id"] as string || "demo_user_123";
    let user = await storage.getUserByTelegramId(telegramId);
    
    // Create user if doesn't exist (for testing multiple personas)
    if (!user) {
      user = await storage.createUser({ telegramId });
    }

    try {
      const { role } = api.users.setRole.input.parse(req.body);
      const updatedUser = await storage.updateUserRole(user.id, role);
      res.json(updatedUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get("/api/admin/tasks", async (req, res) => {
    const telegramId = req.headers["x-telegram-id"] as string || "demo_user_123";
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    
    const allTasks = await storage.getAllTasks();
    res.json(allTasks);
  });

  // --- Tasks API ---

  app.get(api.tasks.list.path, async (req, res) => {
    const telegramId = req.headers["x-telegram-id"] as string || "demo_user_123";
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    
    const userTasks = await storage.getTasksByUser(user.id);
    res.json(userTasks);
  });

  app.get(api.tasks.submitted.path, async (req, res) => {
    const submittedTasks = await storage.getAllSubmittedTasks();
    res.json(submittedTasks);
  });

  app.get(api.tasks.get.path, async (req, res) => {
    const task = await storage.getTask(Number(req.params.id));
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      // Get current user from Telegram ID
      const telegramId = req.headers["x-telegram-id"] as string || "demo_user_123";
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      const input = api.tasks.create.input.parse(req.body);

      // Check balance
      if (user.balance < input.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct balance (escrow)
      await storage.updateUserBalance(user.id, -input.amount);

      const task = await storage.createTask({
        ...input,
        userId: user.id
      });
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.tasks.submitEvidence.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { evidenceUrl } = api.tasks.submitEvidence.input.parse(req.body);
      
      // Log the update attempt
      console.log(`[Evidence] Submitting for task ${id}: ${evidenceUrl}`);
      
      const task = await storage.submitEvidence(id, evidenceUrl);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      console.log(`[Evidence] Task ${id} status updated to: ${task.status}`);
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Mock Admin Actions for MVP
  app.post(api.tasks.complete.path, async (req, res) => {
    const id = Number(req.params.id);
    const task = await storage.getTask(id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    
    if (task.status === "completed") return res.json(task);

    // Return funds to user
    await storage.updateUserBalance(task.userId, task.amount);
    
    const updated = await storage.updateTaskStatus(id, "completed");
    res.json(updated);
  });

  app.post(api.tasks.fail.path, async (req, res) => {
    const id = Number(req.params.id);
    // Funds are already deducted, so we just mark as failed
    // The money "stays with us" (is burned/kept in escrow)
    const updated = await storage.updateTaskStatus(id, "failed");
    res.json(updated);
  });

  return httpServer;
}
