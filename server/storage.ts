import { db } from "./db";
import {
  users, tasks, transactions,
  type User, type InsertUser,
  type Task, type InsertTask,
  type Transaction, type InsertTransaction
} from "@shared/schema";
import { eq, desc, and, sql,or,lte } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserByAddress(address: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(address: string, role: string): Promise<User>;
  getAdmins(): Promise<User[]>;

  // Tasks
  getTasks(): Promise<any[]>;
  getTasksByUser(userAddress: string): Promise<Task[]>;
  getAllSubmittedTasks(): Promise<any[]>;
  getTask(id: number): Promise<any | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTaskStatus(id: number, status: string, rejectionReason?: string, newDeadline?: Date, clearEvidence?: boolean): Promise<Task>;
  submitEvidence(id: number, evidenceUrl: string): Promise<Task>;
  setTaskNotified(id: number, type: '24h' | '1h'): Promise<void>;
  getTasksForDeadlineCheck(threshold: Date): Promise<Task[]>;

  // Transactions
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByAddress(userAddress: string): Promise<Transaction[]>;
  getTransactionsByType(type: string): Promise<any[]>;
  updateTransactionStatus(id: number, status: string, rejectionReason?: string): Promise<Transaction>;
  updateTransactionStatusSafe(id: number, status: string, rejectionReason?: string): Promise<Transaction | undefined>;
}

export class DatabaseStorage implements IStorage {
  // --- USERS ---
  async getUserByAddress(address: string): Promise<User | undefined> {
  
    const [user] = await db.select().from(users).where(eq(users.address, address.toLowerCase()));
    return user;
 
}

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      address: insertUser.address.toLowerCase()
    }).returning();
    return user;
  }

  async updateUserRole(address: string, role: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ role })
      .where(eq(users.address, address.toLowerCase()))
      .returning();
    return updated;
  }

  async getAdmins(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "admin"));
  }

  // --- TASKS ---
  async getTasks(): Promise<any[]> {
    return await db
      .select()
      .from(tasks)
      .orderBy(desc(tasks.createdAt));
  }
  async getTasksForDeadlineCheck(threshold: Date): Promise<Task[]> {
  return await db.select()
    .from(tasks)
    .where(
      and(
        or(
          eq(tasks.status, "pending"),
          eq(tasks.status, "submitted"),
          eq(tasks.status, "failed")
        ),
        lte(tasks.deadline, threshold)
      )
    );
}

  async getTasksByUser(userAddress: string): Promise<Task[]> {
    return await db.select()
      .from(tasks)
      .where(eq(tasks.userAddress, userAddress.toLowerCase()))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<any | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values({
    ...insertTask,
    userAddress: insertTask.userAddress.toLowerCase()
  }).returning();
    return task;
  }

  async updateTaskStatus(id: number, status: string, rejectionReason?: string, newDeadline?: Date, clearEvidence: boolean = false): Promise<Task> {
    const [task] = await db.update(tasks)
      .set({ 
        status,
        rejectionReason: rejectionReason || null,
        ...(newDeadline && { deadline: newDeadline }),
        ...(clearEvidence && { evidenceUrl: null }),
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    
    if (!task) throw new Error("Task not found");
    return task;
  }

  async submitEvidence(id: number, evidenceUrl: string): Promise<Task> {
    const [task] = await db.update(tasks)
      .set({ 
        evidenceUrl,
        status: "submitted",
        updatedAt: new Date()
      })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async getAllSubmittedTasks(): Promise<any[]> {
    return await db.select()
      .from(tasks)
      .where(eq(tasks.status, 'submitted'))
      .orderBy(desc(tasks.createdAt));
  }

  async setTaskNotified(id: number, type: '24h' | '1h'): Promise<void> {
    const updateData = type === '24h' ? { notified24h: true } : { notified1h: true };
    await db.update(tasks).set(updateData).where(eq(tasks.id, id));
  }

  // --- TRANSACTIONS ---
  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(tx).returning();
    return transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionsByAddress(userAddress: string): Promise<Transaction[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.userAddress, userAddress.toLowerCase()))
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByType(type: string): Promise<any[]> {
    return await db.select()
      .from(transactions)
      .where(eq(transactions.type, type))
      .orderBy(desc(transactions.createdAt));
  }

  async updateTransactionStatus(id: number, status: string, rejectionReason?: string): Promise<Transaction> {
    const [updated] = await db.update(transactions)
      .set({ status, rejectionReason: rejectionReason || null })
      .where(eq(transactions.id, id))
      .returning();
    if (!updated) throw new Error("Transaction not found");
    return updated;
  }

  async updateTransactionStatusSafe(id: number, status: string, rejectionReason?: string): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions)
      .set({ status, rejectionReason: rejectionReason || null })
      .where(and(eq(transactions.id, id), eq(transactions.status, 'pending')))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();