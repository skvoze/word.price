import { db } from "./db";
import {
  users, tasks,
  type User, type InsertUser,
  type Task, type InsertTask,
  type SubmitEvidenceRequest
} from "@shared/schema";
import { eq } from "drizzle-orm";

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
  updateTaskStatus(id: number, status: string): Promise<Task>;
  submitEvidence(id: number, evidenceUrl: string): Promise<Task>;
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
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const newBalance = (user.balance || 0) + amount;
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
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(tasks.createdAt);
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(tasks.createdAt);
  }

  async getAllSubmittedTasks(): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.status, 'submitted')).orderBy(tasks.createdAt);
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const [task] = await db.update(tasks)
      .set({ status })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async submitEvidence(id: number, evidenceUrl: string): Promise<Task> {
    const [task] = await db.update(tasks)
      .set({ 
        evidenceUrl,
        status: "submitted"
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }
}

export const storage = new DatabaseStorage();
