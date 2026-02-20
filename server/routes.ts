  import type { Express,Request, Response, NextFunction } from "express";
  import type { Server } from "http";
  import { storage } from "../server/storage";
  import { api } from "@shared/routes";
  import { registerChatRoutes } from "./replit_integrations/chat";
  import { registerImageRoutes } from "./replit_integrations/image";
  import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
  import { addFundsSchema } from "@shared/schema";
  import crypto from "crypto";

  const MERCHANT_LOGIN = process.env.ROBOKASSA_LOGIN;
const PASS1 = process.env.ROBOKASSA_PASS1; 
const PASS2 = process.env.ROBOKASSA_PASS2; 
const IS_TEST = process.env.NODE_ENV !== "production" ? 1 : 0;

function generateRobokassaUrl(invoiceId: number, amount: number, description: string) {
  const sum = (amount / 100).toFixed(2); 
  const signature = crypto
    .createHash("md5")
    .update(`${MERCHANT_LOGIN}:${sum}:${invoiceId}:${PASS1}`)
    .digest("hex");

  return `https://auth.robokassa.ru/Merchant/Index.aspx?MerchantLogin=${MERCHANT_LOGIN}&OutSum=${sum}&InvId=${invoiceId}&Description=${encodeURIComponent(description)}&SignatureValue=${signature}&IsTest=${IS_TEST}`;
}

  function validateTelegramInitData(initData: string): { success: boolean; user?: any } {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN || !initData) return { success: false };

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  urlParams.delete("hash");
  const dataCheckString = Array.from(urlParams.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (calculatedHash !== hash) return { success: false };

  const user = JSON.parse(urlParams.get("user") || "{}");
  return { success: true, user };
}
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const initData = req.headers["x-telegram-init-data"] as string;
  
  // Для тестов можно оставить x-telegram-id, но в продакшене ТОЛЬКО initData
  if (!initData) return res.status(401).json({ message: "Auth required" });

  const { success, user: tgUser } = validateTelegramInitData(initData);
  if (!success) return res.status(403).json({ message: "Invalid auth data" });

  const telegramId = tgUser.id.toString();

  try {
    let user = await storage.getUserByTelegramId(telegramId);
    if (!user) {
      try {
        user = await storage.createUser({ 
          telegramId, 
        });
      } catch (createError) {
        user = await storage.getUserByTelegramId(telegramId);
      }
    }

    if (!user) {
      return res.status(500).json({ message: "Не удалось инициализировать пользователя" });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error("[Auth Error]:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
async function notifyAdmins(message: string) {
  try {
    const admins = await storage.getAdmins();
    for (const admin of admins) {
      if (admin.telegramId) {
        await sendTelegramNotification(admin.telegramId, message);
      }
    }
  } catch (e) {
    console.error("[Notify Admins Error]:", e);
  }
}
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
      const allTasks = await storage.getTasks();
      const activeTasks = allTasks.filter(t => t.status !== "completed");
      if (activeTasks.length === 0) return;
      const now = new Date();

      for (const task of activeTasks) {
        if (task.status === "pending"|| task.status === "failed") {
          const deadline = new Date(task.deadline);
          const diffMs = deadline.getTime() - now.getTime();
          const diffMinutes = Math.floor(diffMs / 60000);

          if (diffMs <= 0) {
            if (task.status === "pending") {
            await storage.updateTaskStatus(task.id, "failed", "Время на выполнение истекло");
            if (task.userTelegramId) {
              await sendTelegramNotification(task.userTelegramId, 
                `⌛ <b>Время вышло!</b>\n\nСрок выполнения задачи "<b>${task.title}</b>" истек. Услуги мониторинга считаются оказанными, предоплата удержана.`);
            }
          }
          } else if (task.userTelegramId) {
            if (diffMinutes === 1440 ) {
              await sendTelegramNotification(task.userTelegramId, `⚠️ <b>Осталось меньше суток!</b>\n\n` +
          `Задача: "<b>${task.title}</b>"\n` +
          `Срок истекает: ${deadline.toLocaleString('ru-RU')}\n\n` +
          `Не забудь загрузить отчет, иначе предоплата будет удержана.`);
            }
            if (diffMinutes === 60) {
              await sendTelegramNotification(task.userTelegramId, `🚨 <b>Последний шанс!</b>\n\n` +
          `До конца задачи "<b>${task.title}</b>" осталось меньше часа!\n` +
          `Срочно загрузи доказательства выполнения.`);
            }
          }
        }
        if (task.status === "submitted") {
          const dateToCompare = task.updatedAt || task.createdAt;
  
  if (!dateToCompare) {
    console.log(`[Auto-Approve] У задачи #${task.id} нет даты обновления/создания`);
    continue;
  }
          const submissionDate = new Date(task.updatedAt || task.createdAt);
          if (isNaN(submissionDate.getTime())) {
      console.log(`[Auto-Approve] Ошибка: Невалидная дата у задачи #${task.id}: ${dateToCompare}`);
      continue;
    }
          const msPassed = now.getTime() - submissionDate.getTime();
          const hoursPassed = msPassed / (1000 * 60 * 60);

          if (hoursPassed >= 24) {
            await storage.updateUserBalance(task.userId, task.amount);
            await storage.createTransaction({
              userId: task.userId,
              amount: task.amount,
              type: "task_refund",
              status: "completed",
              description: `Подтверждение выполнения: ${task.title}`
            });
            await storage.updateTaskStatus(task.id, "completed");

            if (task.userTelegramId) {
              await sendTelegramNotification(task.userTelegramId, 
                `✅ <b>Задача одобрена!</b>\n\nРезультат по задаче "<b>${task.title}</b>" подтвержден. Предоплата <b>${task.amount / 100} ₽</b> возвращена на ваш баланс.`);
            }
            console.log(`[Auto-Approve] Задача #${task.id} одобрена по истечении 24ч`);
          }
        }
      }
    } catch (err) {
      console.error("[Deadline Checker Error]:", err);
    }
  }, 60 * 1000); 
}
  export async function registerRoutes(
    httpServer: Server,
    app: Express
  ): Promise<Server> {
    registerChatRoutes(app);
    registerImageRoutes(app);
    registerObjectStorageRoutes(app);
    app.get(api.users.me.path,authMiddleware, async (req: any, res) => {
      res.json(req.user);
    });
    app.post(api.users.addFunds.path,authMiddleware, async (req: any, res) => {
  try {
    const isTest = process.env.NODE_ENV !== "production" ? 1 : 1;
    const user = req.user;
    const { amount } = addFundsSchema.parse(req.body);
    const transaction = await storage.createTransaction({
      userId: user.id,
      amount: amount,
      type: "topup",
      status: "pending", 
      description: "Пополнение баланса через Робокассу",
    });
    const paymentUrl = generateRobokassaUrl(transaction.id, amount, "Пополнение баланса");

    res.json({ paymentUrl }); 
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.post("/api/payment/result", async (req, res) => {
  const { OutSum, InvId, SignatureValue } = req.body;
  const mySignature = crypto
    .createHash("md5")
    .update(`${OutSum}:${InvId}:${PASS2}`)
    .digest("hex")
    .toUpperCase();

  if (mySignature !== (SignatureValue as string).toUpperCase()) {
    console.error(`[Payment Error] Invalid signature. Expected ${mySignature}, got ${SignatureValue}`);
    return res.status(400).send("bad signature");
  }

  const transactionId = Number(InvId);
  const tx = await storage.getTransaction(transactionId);

  if (tx && tx.status === "pending") {
    await storage.updateTransactionStatus(transactionId, "completed");
    await storage.updateUserBalance(tx.userId, tx.amount);
    const user = await storage.getUser(tx.userId);
    if (user?.telegramId) {
      await sendTelegramNotification(user.telegramId, `✅ <b>Баланс пополнен!</b>\nСумма <b>${tx.amount / 100} ₽</b> зачислена.`);
    }
  }

  res.send(`OK${InvId}`);
});

  app.get("/api/admin/withdrawals",authMiddleware, async (req: any, res) => {
const telegramId = req.user.telegramId;
  if (!telegramId) return res.status(401).send("Unauthorized");
  const user = await storage.getUserByTelegramId(telegramId);
  if (!user || user.role !== 'admin') {
    console.log(`[Access Denied] User ${telegramId} tried to access admin withdrawals`);
    return res.status(403).json({ message: "У вас нет прав администратора" });
  }    const transactions = await storage.getTransactionsByType("withdraw");
    res.json(transactions);
  });

  app.patch("/api/admin/transactions/:id",authMiddleware, async (req: any, res) => {
    try {
      const { status, rejectionReason } = req.body; 
      const transactionId = Number(req.params.id);

      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Некорректный ID транзакции" });
      }
      const tx = await storage.getTransaction(transactionId);
      if (!tx) return res.status(404).json({ message: "Транзакция не найдена" });
    if (tx.status !== 'pending') {
      return res.json(tx);
    }
      const updated = await storage.updateTransactionStatus(transactionId, status, rejectionReason);
      if (tx) {
        const user = await storage.getUser(tx.userId); 
        if (user && user.telegramId) {
          if (status === 'completed') {
            const clearAmount = Math.abs(tx.amount) * 0.95 / 100;
            await sendTelegramNotification(user.telegramId, 
              `✅ <b>Выплата одобрена!</b>\n\nСумма <b>${clearAmount.toLocaleString()} ₽</b> (с учетом комиссии) отправлена на вашу карту. Ожидайте зачисления.`);
          } else if (status === 'rejected') {
            await storage.updateUserBalance(tx.userId, Math.abs(tx.amount));
            await sendTelegramNotification(user.telegramId, 
              `❌ <b>Отказ в выплате</b>\n\nПричина: ${rejectionReason || "не указана"}.\nСредства возвращены на ваш баланс в приложении.`);
          }
        }
      }
      
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
  app.post("/api/users/withdraw", authMiddleware, async (req: any, res) => {
  try {
    const user = req.user; 
    const { amount, cardNumber, metadata } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Сумма должна быть больше нуля" });
    }
    if (amount < 10000) {
      return res.status(400).json({ message: "Минимальная сумма вывода — 100 ₽" });
    }
    const rawCard = (metadata?.cardNumber || cardNumber || "").toString();
    const cleanCard = rawCard.replace(/\D/g, ""); 

    if (cleanCard.length !== 16) {
      return res.status(400).json({ 
        message: `Номер карты должен содержать 16 цифр` 
      });
    }
    if (user.balance < amount) {
      return res.status(400).json({ message: "Недостаточно средств на балансе" });
    }
    const transactions = await storage.getTransactionsByUserId(user.id);
    const hasPending = transactions.some(t => t.type === "withdraw" && t.status === "pending");
    if (hasPending) {
      return res.status(400).json({ message: "У вас уже есть активная заявка на вывод. Дождитесь её обработки." });
    }

    const transaction = await storage.createTransaction({
      userId: user.id,
      amount: -amount, 
      type: "withdraw",
      status: "pending",
      description: `Вывод на карту ****${cleanCard.slice(-4)}`,
      metadata: { 
        cardNumber: cleanCard,
        userNote: metadata?.userNote || "" 
      }
    });

    const updatedUser = await storage.updateUserBalance(user.id, -amount);

    await notifyAdmins(
  `<b>💰 Новая заявка на вывод!</b>\n\n` +
  `Пользователь ID: <code>${user.telegramId}</code>\n` +
  `Сумма: <b>${amount / 100} ₽</b>\n` +
  `Карта: <code>${cleanCard}</code>`
);

    res.json({ 
      user: updatedUser, 
      transactionId: transaction.id,
      message: "Заявка на вывод успешно создана" 
    });

  } catch (err: any) {
    console.error("Withdraw error:", err);
    res.status(500).json({ message: "Ошибка сервера при обработке вывода" });
  }
});


    app.get("/api/transactions",authMiddleware, async (req: any, res) => {
      try {
        const telegramId = req.user.telegramId ;
        if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
        const user = await storage.getUserByTelegramId(telegramId);
        if (!user) return res.status(401).json({ message: "Not authenticated" });

        const history = await storage.getTransactionsByUserId(user.id);
        res.json(history);
      } catch (err: any) {
        res.status(500).json({ message: err.message });
      }
    });


    app.get(api.tasks.list.path,authMiddleware, async (req: any, res) => {
      const telegramId = req.user.telegramId ;
      if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
      const user = await storage.getUserByTelegramId(telegramId);
      if (!user) return res.status(401).json({ message: "Not authenticated" });
      const userTasks = await storage.getTasksByUser(user.id);
      res.json(userTasks);
    });

    app.post(api.tasks.create.path,authMiddleware, async (req: any, res) => {
      try {
        const telegramId = req.user.telegramId ;
        if (!telegramId) return res.status(401).json({ message: "Telegram ID missing" });
        const user = await storage.getUserByTelegramId(telegramId);
        if (!user) return res.status(401).json({ message: "Not authenticated" });
  const input = api.tasks.create.input.parse(req.body);
      
      if (input.amount < 10000) { 
          return res.status(400).json({ message: "Минимальная предоплата — 100 ₽" });
      }
        if (user.balance < input.amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }

        await storage.updateUserBalance(user.id, -input.amount);
        await storage.createTransaction({
          userId: user.id,
          amount: -input.amount,
          type: "task_amount",
          status: "completed",
          description: `Предоплата за услуги мониторинга: ${input.title}`
        });

        const task = await storage.createTask({ ...input, userId: user.id });
        res.status(201).json(task);
      } catch (err: any) {
        res.status(400).json({ message: err.message });
      }
    });

    app.post(api.tasks.complete.path,authMiddleware, async (req: any, res) => {
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
          description: `Возврат предоплаты за выполнение задачи: ${task.title}`
        });

        const updated = await storage.updateTaskStatus(id, "completed");
        const user = await storage.getUser(task.userId);
      if (user?.telegramId) {
        await sendTelegramNotification(user.telegramId, 
          `🌟 <b>Задание принято!</b>\n\nТвое решение по задаче "<b>${task.title}</b>" одобрено. Предоплата в размере <b>${task.amount / 100} ₽</b> возвращена.`);
      }
        res.json(updated);
      } catch (err: any) {
        res.status(500).json({ message: err.message });
      }
    });

    app.post(api.tasks.fail.path,authMiddleware, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { rejectionReason } = req.body;

      const task = await storage.getTask(id);
      if (!task) return res.status(404).json({ message: "Task not found" });

      const bonusDeadline = new Date();
    bonusDeadline.setHours(bonusDeadline.getHours() + 48);
    const currentDeadline = new Date(task.deadline);
    const finalDeadline = bonusDeadline > currentDeadline ? bonusDeadline : currentDeadline;

    const updated = await storage.updateTaskStatus(
      id, 
      "failed", 
      rejectionReason, 
      finalDeadline, 
      true
    );     
      const user = await storage.getUser(task.userId);
      if (user?.telegramId) {
      const isExtended = bonusDeadline > currentDeadline;
      const message = isExtended 
        ? `⚠️ <b>Отчет не принят</b>\n\nПричина: ${rejectionReason}\n\nМы продлили срок на 48 часов. Новый дедлайн: <b>${finalDeadline.toLocaleString('ru-RU')}</b>`
        : `⚠️ <b>Отчет не принят</b>\n\nПричина: ${rejectionReason}\n\nСрок задачи остается прежним. Успей загрузить до: <b>${finalDeadline.toLocaleString('ru-RU')}</b>`;

      await sendTelegramNotification(user.telegramId, message);
    }
      res.json(updated);
    } catch (err) {
      console.error("[Task Fail Error]:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

    app.get(api.tasks.submitted.path,authMiddleware, async (req: any, res) => {
      try {
        const telegramId = req.user.telegramId ;
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

    app.post(api.tasks.submitEvidence.path,authMiddleware, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { evidenceUrl } = api.tasks.submitEvidence.input.parse(req.body);
      const task = await storage.submitEvidence(id, evidenceUrl);
      if (!task) return res.status(404).json({ message: "Задача не найдена" });
    await notifyAdmins(`<b>📦 Новое решение!</b>\nПользователь прислал отчет по задаче #${id}. Пора проверять!`);
      res.json(task);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Ошибка загрузки" });
    }
  });
    app.get(api.tasks.get.path,authMiddleware, async (req: any, res) => {
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
    
  app.get("/api/admin/tasks",authMiddleware, async (req: any, res) => {
      try {
        const telegramId = req.user.telegramId;
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
  app.post("/api/webhook", async (req: any, res) => {
    try {
      const { message } = req.body;
      console.log("[Webhook] Received message:", message?.text, "from:", message?.from?.id);
  const chatId = message.chat.id;
        const firstName = message.from.first_name || "пользователь";
        const appUrl = process.env.APP_URL;
      if (message && message.text === "/start") {
        

        if (!appUrl) {
          console.error("[Webhook Error] APP_URL is not defined in environment variables");
        }
        const welcomeText = `
  <b>Привет, ${firstName}! 👋</b>

  Я помогу тебе доводить дела до конца.

  <b>💡 Рекомендации при использовании:</b>

  1. Выбирай сумму так, чтобы тебе было жалко её потерять и она будет тебя мотивировать выполнить задачу.
  2. При создании задачи укажите в описании как будет подтверждаться выполнение.
  3. Если захочешь обмануть при подтверждении выполнения задачи, помни, ты в первую очередь обманываешь себя.
  4. Если возникнут вопросы пишите команду /help.

  Если дедлайн выйдет, а подтверждения не будет — Предоплата удерживается в счет оплаты услуг. 

  <b>С чего начать?</b>
  Просто нажми кнопку ниже и создавай первую задачу!

  Удачи, я в тебя верю! 🚀`;

        const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                { 
                  text: "🚀 Открыть приложение", 
                  web_app: { url: appUrl } 
                }
              ]]
            }
          })
        });

        const result = await response.json();
        if (!result.ok) {
          console.error("[Webhook Error] Telegram API returned error:", result);
        }
      }
      else if (message.text === "/help") {

        if (!appUrl) {
          console.error("[Webhook Error] APP_URL is not defined in environment variables");
        }
        const helpText = `
  <b>🆘 Справка и поддержка</b>

  <b>💰 Финансы:</b>
  • Минимальная предоплата за мониторинг: 100 ₽.
  • Вывод средств: Проверка занимает до 24 часов.
  • Возврат предоплаты: Происходит мгновенно после одобрения отчета админом.

  <b>📝 Задачи:</b>
  • Как сдать? Зайдите в задачу и нажмите "Загрузить доказательства".
  • Что если я не успел? Предоплата удерживается в счет оплаты услуг.

  <b>🤖 Техподдержка:</b>
  Если у вас остались вопросы или возникли проблемы, любым удоьным способом:
  • Telegram: @cena_slova_help
  • Email: cena.slova.help@gmail.com
  • Тел: +7XXXXXXXXXX

  <i>Все условия и реквизиты указаны в Пользовательском соглашении в приложении.</i>`;
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: helpText,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                { 
                  text: "🚀 Открыть приложение", 
                  web_app: { url: appUrl } 
                }
              ]]
            }
          })
        });

        const result = await response.json();
        if (!result.ok) {
          console.error("[Webhook Error] Telegram API returned error:", result);
        }
      
      }
    } catch (err) {
      console.error("[Webhook Error] Internal crash:", err);
    }
    res.sendStatus(200);
  });
    startDeadlineChecker();
    return httpServer;
  }