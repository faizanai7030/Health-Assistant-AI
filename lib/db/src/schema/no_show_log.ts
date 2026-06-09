import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const noShowLogTable = pgTable("no_show_log", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull(),
  patientPhone: text("patient_phone").notNull(),
  patientName: text("patient_name").notNull(),
  appointmentId: integer("appointment_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const patientBlacklistTable = pgTable("patient_blacklist", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull(),
  patientPhone: text("patient_phone").notNull(),
  patientName: text("patient_name").notNull(),
  reason: text("reason"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type NoShowLog = typeof noShowLogTable.$inferSelect;
export type PatientBlacklist = typeof patientBlacklistTable.$inferSelect;
