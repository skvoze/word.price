import type { Express } from "express";
import type { Server } from "http";
import { storage } from "../server/storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { addFundsSchema } from "@shared/schema";

async function sendTelegramNotification(telegramId: string, message: string) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; 
  if (!BOT_TOKEN) return;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (e) {
    console.error("[TG Notification Error]:", e);
  }
}

function startDeadlineChecker() {
  setInterval(async () => {
    try {
      const expiredTasks = await storage.getExpiredTasks();
      
      for (const task of expiredTasks) {
        await storage.updateTaskStatus(task.id, "failed", "Время на выполнение истекло");

        if (task.userTelegramId) {
          const text = `<b>⌛ Время вышло!</b>\n\n` +
                       `Срок выполнения задачи "<b>${task.title}</b>" истек.\n` +
                       `Залог за выполнение задачи удержан.`;
          await sendTelegramNotification(task.userTelegramId, text);
        }
        
        console.log(`[Deadline Checker] Задача ${task.id} отмечена как failed и пользователь уведомлен.`);
      }
    } catch (err) {
      console.error("[Deadline Checker Error]:", err);
    }
  }, 60000); // Проверка раз в минуту
}
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Регистрация интеграций
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerObjectStorageRoutes(app);

  // --- Users API ---
  
  app.get(api.users.me.path, async (req, res) => {
    const telegramId = req.headers["x-telegram-id"] as string;
    if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
    let user = await storage.getUserByTelegramId(telegramId);
    if (!user) user = await storage.createUser({ telegramId });
    res.json(user);
  });

  app.post(api.users.addFunds.path, async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { amount } = addFundsSchema.parse(req.body);
      const updatedUser = await storage.updateUserBalance(user.id, amount);
      
      await storage.createTransaction({
        userId: user.id,
        amount: amount,
        type: "topup",
        status: "completed",
        description: "Пополнение баланса"
      });

      res.json(updatedUser);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Ошибка пополнения" });
    }
  });
app.get("/api/admin/withdrawals", async (req, res) => {
  // Тут должна быть проверка: if (req.user.role !== 'admin') return res.sendStatus(403);
  const transactions = await storage.getTransactionsByType("withdraw");
  res.json(transactions);
});

app.patch("/api/admin/transactions/:id", async (req, res) => {
  try {
    const { status, rejectionReason } = req.body; // Получаем причину из тела запроса
    const transactionId = Number(req.params.id);

    if (isNaN(transactionId)) {
      return res.status(400).json({ message: "Некорректный ID транзакции" });
    }
    const updated = await storage.updateTransactionStatus(transactionId, status, rejectionReason);
    const tx = await storage.getTransaction(transactionId);
    if (tx) {
      const user = await storage.getUser(tx.userId); // Получаем данные пользователя
      if (user && user.telegramId) {
        if (status === 'completed') {
          await sendTelegramNotification(user.telegramId, 
            `✅ <b>Выплата одобрена!</b>\n\nСумма <b>${Math.abs(tx.amount) / 100} ₽</b> отправлена на вашу карту. Ожидайте зачисления.`);
        } else if (status === 'rejected') {
          await sendTelegramNotification(user.telegramId, 
            `❌ <b>Отказ в выплате</b>\n\nПричина: ${rejectionReason || "не указана"}.\nСредства возвращены на ваш баланс в приложении.`);
        }
      }
    }
    if (status === 'rejected') {
      if (!tx) return res.status(404).json({ message: "Транзакция не найдена" });
      await storage.updateUserBalance(tx.userId, Math.abs(tx.amount));
    }
    
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});
 app.post("/api/users/withdraw", async (req, res) => {
  try {
    const telegramId = req.headers["x-telegram-id"] as string;
    if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Добавляем metadata в деструктуризацию
    const { amount, cardNumber, metadata, description } = req.body;
const rawCard = (metadata?.cardNumber || cardNumber || "").toString();
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Сумма должна быть больше нуля" });
    }
    if (amount < 10000) {
    return res.status(400).json({ message: "Минимальная сумма вывода — 100 ₽" });
  }
    const cleanCard = rawCard.replace(/\D/g, ""); 

if (cleanCard.length !== 16) {
  return res.status(400).json({ 
    message: `Номер карты должен содержать 16 цифр (получено: ${cleanCard.length})` 
  });
}
    
    // Проверка карты (теперь поддерживаем и старый формат cardNumber, и новый metadata)
    const finalCardNumber = metadata?.cardNumber || cardNumber;
    if (!finalCardNumber || finalCardNumber.length < 16) {
      return res.status(400).json({ message: "Некорректный номер карты" });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: "Недостаточно средств" });
    }


    const transaction = await storage.createTransaction({
  userId: user.id,
  amount: -amount,
  type: "withdraw",
  status: "pending",
  description: description || `Вывод на карту ****${cleanCard.slice(-4)}`,
  metadata: { cardNumber: cleanCard }
});


const updatedUser = await storage.updateUserBalance(user.id, -amount);
    res.json({ 
      user: updatedUser, 
      transactionId: transaction.id,
      message: "Заявка на вывод создана" 
    });

  } catch (err: any) {
    console.error("Withdraw error:", err);
    res.status(500).json({ message: "Ошибка сервера при обработке вывода" });
  }
});


  app.get("/api/transactions", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string ;
      if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      const history = await storage.getTransactionsByUserId(user.id);
      res.json(history);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Tasks API ---

  app.get(api.tasks.list.path, async (req, res) => {
    const telegramId = req.headers["x-telegram-id"] as string ;
    if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
    const user = await storage.getUserByTelegramId(telegramId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    const userTasks = await storage.getTasksByUser(user.id);
    res.json(userTasks);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string ;
      if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
const input = api.tasks.create.input.parse(req.body);
    
    if (input.amount < 10000) { 
        return res.status(400).json({ message: "Минимальный залог — 100 ₽" });
    }
      if (user.balance < input.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      await storage.updateUserBalance(user.id, -input.amount);
      await storage.createTransaction({
        userId: user.id,
        amount: -input.amount,
        type: "task_pledge",
        status: "completed",
        description: `Залог за задачу: ${input.title}`
      });

      const task = await storage.createTask({ ...input, userId: user.id });
      res.status(201).json(task);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post(api.tasks.complete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const task = await storage.getTask(id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      if (task.status === "completed") return res.json(task);

      await storage.updateUserBalance(task.userId, task.amount);
      await storage.createTransaction({
        userId: task.userId,
        amount: task.amount,
        type: "task_refund",
        status: "completed",
        description: `Возврат залога: ${task.title}`
      });

      const updated = await storage.updateTaskStatus(id, "completed");
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post(api.tasks.fail.path, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rejectionReason } = req.body; // Получаем причину из запроса

    const task = await storage.getTask(id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.status === "failed") return res.json(task);
    const updated = await storage.updateTaskStatus(id, "failed", rejectionReason);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

  app.get(api.tasks.submitted.path, async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string ;
      if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
      const user = await storage.getUserByTelegramId(telegramId);
      if (user && user.role === "admin") {
        const allTasks = await storage.getTasks();
        return res.json(allTasks);
      }
      const submittedTasks = await storage.getAllSubmittedTasks();
      res.json(submittedTasks);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post(api.tasks.submitEvidence.path, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { evidenceUrl } = api.tasks.submitEvidence.input.parse(req.body);
    const task = await storage.submitEvidence(id, evidenceUrl);
    if (!task) return res.status(404).json({ message: "Задача не найдена" });
    await storage.updateTaskStatus(id, "submitted", undefined); 
const ADMIN_ID = "514679635"; 
  await sendTelegramNotification(ADMIN_ID, `<b>📦 Новое решение!</b>\nПользователь прислал отчет по задаче #${id}. Пора проверять!`);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Ошибка загрузки" });
  }
});
  app.get(api.tasks.get.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Некорректный ID задачи" });
      }

      const task = await storage.getTask(id);
      
      if (!task) {
        console.error(`[Server] Task with ID ${id} not found in DB`);
        return res.status(404).json({ message: "Задача не найдена" });
      }
      
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ message: "Ошибка сервера при получении задачи" });
    }
  });
  
app.get("/api/admin/tasks", async (req, res) => {
    try {
      const telegramId = req.headers["x-telegram-id"] as string;
      if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "У вас нет прав доступа к этому разделу" });
      }
      const allTasks = await storage.getTasks();
      res.json(allTasks);
    } catch (err: any) {
      res.status(500).json({ message: "Ошибка при загрузке истории задач" });
    }
  });
  app.post("/api/webhook", async (req, res) => {
  const { message } = req.body;

  if (message && message.text === "/start") {
    const chatId = message.chat.id;
    const firstName = message.from.first_name;

    const welcomeText = `
<b>Привет, ${firstName}! 👋</b>

Я твой персональный контроллер дисциплины. Моя задача — помочь тебе не бросать начатое.

<b>Как это работает?</b>
1. Ты создаешь задачу и вносишь <b>залог</b>.
2. Выполняешь задачу и присылаешь фото-подтверждение.
3. Я проверяю и <b>возвращаю тебе залог</b>.

Если дедлайн выйдет, а подтверждения не будет — залог сгорает. 

<i>Никакого азарта, только чистая продуктивность!</i> 🚀
    `;

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            { text: "🚀 Открыть приложение", web_app: { url: process.env.APP_URL } }
          ]]
        }
      })
    });
  }

  res.sendStatus(200);
});
  startDeadlineChecker();
  return httpServer;
}