import { db } from "./db";
import {
  users, tasks,transactions,
  type User, type InsertUser,
  type Task, type InsertTask,
  type Transaction, type InsertTransaction
} from "@shared/schema";
import { eq, desc, and, lt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByTelegramId(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User>;
  updateUserRole(id: number, role: string): Promise<User>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTasksByUser(userId: number): Promise<Task[]>;
  getAllSubmittedTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTaskStatus(id: number, status: string, rejectionReason?: string): Promise<Task>;
  submitEvidence(id: number, evidenceUrl: string): Promise<Task>;

  getTransactionsByType(type: string): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  updateTransactionStatus(id: number, status: string,rejectionReason?:string): Promise<Transaction>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByTelegramId(telegramId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.telegramId, telegramId));
  return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<User> {
    // amount can be negative
    if (!Number.isFinite(amount) || isNaN(amount)) {
    throw new Error("Некорректная сумма: число должно быть конечным");
  }

  const user = await this.getUser(id);
  if (!user) throw new Error("User not found");
  const currentBalance = user.balance || 0;
  const newBalance = Math.floor(currentBalance + amount);
  const MAX_BALANCE = 1000000000; 
  
  if (newBalance > MAX_BALANCE) {
    throw new Error("Превышен максимальный лимит баланса (10 млн ₽)");
  }
  
  if (newBalance < 0) {
    throw new Error("Недостаточно средств: баланс не может быть отрицательным");
  }
    const [updated] = await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserRole(id: number, role: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Tasks
  async getTasks(): Promise<any[]> {
    return await db
      .select({
        id: tasks.id,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        amount: tasks.amount,
        status: tasks.status,
        deadline: tasks.deadline,
        evidenceUrl: tasks.evidenceUrl,
        createdAt: tasks.createdAt,
        rejectionReason: tasks.rejectionReason,
        userTelegramId: users.telegramId, 
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.userId, users.id))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(tasks.createdAt);
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getAllSubmittedTasks(): Promise<any[]> {
    return await db
      .select({
        id: tasks.id,
        userId: tasks.userId,
        title: tasks.title,
        description: tasks.description,
        amount: tasks.amount,
        status: tasks.status,
        deadline: tasks.deadline,
        evidenceUrl: tasks.evidenceUrl,
        createdAt: tasks.createdAt,
        userTelegramId: users.telegramId, 
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.userId, users.id))
      .where(eq(tasks.status, 'submitted'))
      .orderBy(tasks.createdAt);
  }

  async getTask(id: number): Promise<any | undefined> {
  const [task] = await db
    .select({
      id: tasks.id,
      userId: tasks.userId,
      title: tasks.title,
      description: tasks.description,
      amount: tasks.amount,
      status: tasks.status,
      deadline: tasks.deadline,
      evidenceUrl: tasks.evidenceUrl,
      createdAt: tasks.createdAt,
      rejectionReason: tasks.rejectionReason,
      userTelegramId: users.telegramId,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.userId, users.id))
    .where(eq(tasks.id, id));
  
  return task;
}

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTaskStatus(id: number, status: string, rejectionReason?: string): Promise<Task> {
  const [task] = await db.update(tasks)
    .set({ 
      status,
      rejectionReason: rejectionReason || null 
    })
    .where(eq(tasks.id, id))
    .returning();
  
  if (!task) throw new Error("Task not found");
  return task;
}

  async submitEvidence(id: number, evidenceUrl: string): Promise<Task> {
    console.log(`[Storage] submitEvidence called for ID ${id} with URL ${evidenceUrl}`);
    const [task] = await db.update(tasks)
      .set({ 
        evidenceUrl: evidenceUrl,
        status: "submitted"
      })
      .where(eq(tasks.id, id))
      .returning();
    
    if (task) {
      console.log(`[Storage] Task ${id} updated successfully:`, JSON.stringify(task));
    } else {
      console.error(`[Storage] Task ${id} NOT found for update`);
    }
    return task;
  }
  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
  const [transaction] = await db.insert(transactions) // или db.insert
    .values(tx)
    .returning();
  return transaction;
}
async getTasksByStatus(status: string): Promise<Task[]> {
  return await db.select().from(tasks).where(eq(tasks.status, status));
}
async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
  return await db.select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt));
}
async getTransactionsByType(type: string) {
  return await db
    .select({
      // Все поля транзакции
      id: transactions.id,
      userId: transactions.userId,
      amount: transactions.amount,
      type: transactions.type,
      status: transactions.status,
      description: transactions.description,
      metadata: transactions.metadata,
      createdAt: transactions.createdAt,
      rejectionReason: transactions.rejectionReason,
      telegramId: users.telegramId, 

    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id)) // Присоединяем таблицу юзеров
    .where(eq(transactions.type, type))
    .orderBy(desc(transactions.createdAt));
}
async getExpiredTasks(): Promise<any[]> {
  const now = new Date();
  // Выбираем только те задачи, которые просрочены, но статус всё еще 'pending'
  // Это гарантирует, что мы обработаем каждую задачу только ОДИН раз
  return await db
    .select({
      id: tasks.id,
      title: tasks.title,
      userId: tasks.userId,
      userTelegramId: users.telegramId, 
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.userId, users.id))
    .where(
      and(
        eq(tasks.status, 'pending'),
        lt(tasks.deadline, now)
      )
    );
}
async getTransaction(id: number): Promise<Transaction | undefined> {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id));
  return transaction;
}

async updateTransactionStatus(id: number, status: string, rejectionReason?: string): Promise<Transaction> {
  const [updated] = await db
    .update(transactions)
    .set({ 
      status, 
      rejectionReason: rejectionReason || null // Сохраняем причину
    })
    .where(eq(transactions.id, id))
    .returning();
  
  if (!updated) throw new Error("Transaction not found");
  return updated;
}
}

export const storage = new DatabaseStorage();
