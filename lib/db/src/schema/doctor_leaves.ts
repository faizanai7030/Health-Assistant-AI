import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { doctorsTable } from "./doctors";

export const doctorLeavesTable = pgTable("doctor_leaves", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctorsTable.id, { onDelete: "cascade" }),
  clinicId: integer("clinic_id").notNull(),
  leaveDate: text("leave_date").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DoctorLeave = typeof doctorLeavesTable.$inferSelect;
