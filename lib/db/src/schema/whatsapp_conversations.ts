import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const whatsappConversationsTable = pgTable("whatsapp_conversations", {
  id: serial("id").primaryKey(),
  patientPhone: text("patient_phone").notNull().unique(),
  patientName: text("patient_name"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWhatsappConversationSchema = createInsertSchema(whatsappConversationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWhatsappConversation = z.infer<typeof insertWhatsappConversationSchema>;
export type WhatsappConversation = typeof whatsappConversationsTable.$inferSelect;
