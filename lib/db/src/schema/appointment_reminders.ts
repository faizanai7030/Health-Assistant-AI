import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentRemindersTable = pgTable("appointment_reminders", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id"),
  appointmentId: integer("appointment_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  doctorName: text("doctor_name").notNull(),
  appointmentDate: text("appointment_date").notNull(),
  timeSlot: text("time_slot").notNull(),
  reminderMessage: text("reminder_message").notNull(),
  status: text("status").notNull().default("pending"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAppointmentReminderSchema = createInsertSchema(appointmentRemindersTable).omit({ id: true, createdAt: true });
export type InsertAppointmentReminder = z.infer<typeof insertAppointmentReminderSchema>;
export type AppointmentReminderRow = typeof appointmentRemindersTable.$inferSelect;
