import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { analystsTable } from "./analysts";
import { itemsTable } from "./items";

export const transactionTypeEnum = pgEnum("transaction_type", ["IN", "OUT"]);

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => itemsTable.id, { onDelete: "cascade" }),
  analystId: integer("analyst_id").notNull().references(() => analystsTable.id),
  type: transactionTypeEnum("type").notNull(),
  qty: integer("qty").notNull(),
  shift: text("shift"),   // "Shift 1" | "Shift 2" | "Shift 3" | null
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
