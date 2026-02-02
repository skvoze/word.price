import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export chat models from the integration
export * from "./models/chat";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull().unique(),
  balance: integer("balance").notNull().default(0), 
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
  rejectionReason: text("rejection_reason"),
  evidenceUrl: text("evidence_url"),
  createdAt: timestamp("created_at").defaultNow(),
});
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), 
  type: text("type").notNull(), 
  status: text("status").notNull().default("completed"), 
  rejectionReason: text("rejection_reason"),
  description: text("description"),
  metadata: jsonb("metadata").$type<{ cardNumber?: string; bankName?: string;userNote?: string; }>(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const insertUserSchema = createInsertSchema(users).omit({ id: true, balance: true, createdAt: true, role: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, status: true, evidenceUrl: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
// Explicit API types
export type CreateTaskRequest = InsertTask;
export type SubmitEvidenceRequest = { evidenceUrl: string };
export const addFundsSchema = z.object({
  amount: z.number().min(10000, "Минимальная сумма — 100 ₽"), // или просто z.object({ amount: z.number() })
});
export type AddFundsRequest = z.infer<typeof addFundsSchema>;