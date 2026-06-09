import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const waitlistTable = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id").notNull(),
  doctorId: integer("doctor_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone").notNull(),
  requestedDate: text("requested_date").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("waiting"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Waitlist = typeof waitlistTable.$inferSelect;
