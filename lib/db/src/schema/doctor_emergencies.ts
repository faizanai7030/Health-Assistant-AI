import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorEmergenciesTable = pgTable("doctor_emergencies", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull(),
  date: text("date").notNull(),
  type: text("type").notNull(),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDoctorEmergencySchema = createInsertSchema(doctorEmergenciesTable).omit({ id: true, createdAt: true });
export type InsertDoctorEmergency = z.infer<typeof insertDoctorEmergencySchema>;
export type DoctorEmergencyRow = typeof doctorEmergenciesTable.$inferSelect;
