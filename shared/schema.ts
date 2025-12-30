import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export chat models from the integration
export * from "./models/chat";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  balance: integer("balance").notNull().default(0), // Balance in cents
  role: text("role").notNull().default("user"), // "user" or "admin"
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // In a real app, this would reference users.id
  title: text("title").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(), // Pledge amount in cents
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("pending"), // pending, submitted, completed, failed
  evidenceUrl: text("evidence_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, balance: true, createdAt: true, role: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, status: true, evidenceUrl: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// Explicit API types
export type CreateTaskRequest = InsertTask;
export type SubmitEvidenceRequest = { evidenceUrl: string };
export type AddFundsRequest = { amount: number };
