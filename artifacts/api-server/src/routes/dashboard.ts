import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, appointmentsTable, doctorsTable, whatsappConversationsTable, whatsappMessagesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const [doctorCount] = await db.select({ count: sql<number>`count(*)::int` }).from(doctorsTable)
    .where(and(eq(doctorsTable.clinicId, clinicId), eq(doctorsTable.isActive, true)));
  const [todayCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), eq(appointmentsTable.appointmentDate, today), sql`${appointmentsTable.status} != 'cancelled'`));
  const [weekCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), sql`${appointmentsTable.appointmentDate} >= ${weekStartStr}`, sql`${appointmentsTable.status} != 'cancelled'`));
  const [convCount] = await db.select({ count: sql<number>`count(*)::int` }).from(whatsappConversationsTable)
    .where(eq(whatsappConversationsTable.clinicId, clinicId));
  const [pendingCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), eq(appointmentsTable.status, "scheduled")));
  const [completedCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), eq(appointmentsTable.appointmentDate, today), eq(appointmentsTable.status, "completed")));

  res.json({
    totalDoctors: doctorCount?.count ?? 0,
    totalAppointmentsToday: todayCount?.count ?? 0,
    totalAppointmentsThisWeek: weekCount?.count ?? 0,
    totalConversations: convCount?.count ?? 0,
    pendingAppointments: pendingCount?.count ?? 0,
    completedToday: completedCount?.count ?? 0,
  });
});

router.get("/dashboard/today", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const today = new Date().toISOString().split("T")[0];
  const rows = await db
    .select()
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(and(eq(appointmentsTable.clinicId, clinicId), eq(appointmentsTable.appointmentDate, today), sql`${appointmentsTable.status} != 'cancelled'`))
    .orderBy(appointmentsTable.timeSlot);

  res.json(
    rows.map((row) => ({
      id: row.appointments.id,
      patientName: row.appointments.patientName,
      patientPhone: row.appointments.patientPhone,
      doctorId: row.appointments.doctorId,
      doctorName: row.doctors?.name ?? "Unknown",
      doctorSpecialization: row.doctors?.specialization ?? "Unknown",
      appointmentDate: row.appointments.appointmentDate,
      timeSlot: row.appointments.timeSlot,
      status: row.appointments.status,
      notes: row.appointments.notes,
      createdAt: row.appointments.createdAt.toISOString(),
    }))
  );
});

export default router;
