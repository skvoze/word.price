import { pgTable, text, serial, integer, jsonb, timestamp, boolean,decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/chat";

export const users = pgTable("users", {

  address: text("address").primaryKey(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});


export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userAddress: text("user_address").notNull().references(() => users.address), 
  title: text("title").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(), 
  deadline: timestamp("deadline").notNull(),
  status: text("status").notNull().default("pending"), 
  rejectionReason: text("rejection_reason"),
  evidenceUrl: text("evidence_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  notified24h: boolean("notified_24h").notNull().default(false),
  notified1h: boolean("notified_1h").notNull().default(false),
  chainId: integer("chain_id").notNull().default(8453),
});


export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userAddress: text("user_address").notNull().references(() => users.address),
  amount: integer("amount").notNull(), 
  type: text("type").notNull(), 
  status: text("status").notNull().default("completed"), 
  rejectionReason: text("rejection_reason"),
  description: text("description"),
  txHash: text("tx_hash").unique(), 
  chainId: integer("chain_id").notNull().default(8453),
  metadata: jsonb("metadata").$type<{ 
    cardNumber?: string; 
    bankName?: string;
    userNote?: string;
    acceptedTerms?: boolean;
    [key: string]: any; 
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, role: true });
export const insertTaskSchema = createInsertSchema(tasks, {
  deadline: z.coerce.date(),
  chainId: z.number().optional(),
}).omit({ 
  id: true, 
  status: true, 
  evidenceUrl: true, 
  createdAt: true, 
  updatedAt: true,
  notified24h: true,
  notified1h: true,
  rejectionReason: true,
});
export const insertTransactionSchema = createInsertSchema(transactions,{chainId: z.number().optional(),}).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type CreateTaskRequest = InsertTask;
export type SubmitEvidenceRequest = { evidenceUrl: string };
export const addFundsSchema = z.object({
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms"
  })
});

export type AddFundsRequest = z.infer<typeof addFundsSchema>;