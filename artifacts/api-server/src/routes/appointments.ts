import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, appointmentsTable, doctorsTable } from "@workspace/db";
import {
  CreateAppointmentBody,
  UpdateAppointmentBody,
  GetAppointmentParams,
  UpdateAppointmentParams,
  DeleteAppointmentParams,
  ListAppointmentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatAppointment(a: typeof appointmentsTable.$inferSelect, doctor: typeof doctorsTable.$inferSelect) {
  return {
    id: a.id,
    tokenNumber: a.tokenNumber ?? null,
    patientName: a.patientName,
    patientPhone: a.patientPhone,
    doctorId: a.doctorId,
    doctorName: doctor.name,
    doctorSpecialization: doctor.specialization,
    appointmentDate: a.appointmentDate,
    timeSlot: a.timeSlot,
    status: a.status,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
  };
}

async function assignTokenNumber(doctorId: number, date: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.doctorId, doctorId),
        eq(appointmentsTable.appointmentDate, date),
        sql`${appointmentsTable.status} != 'cancelled'`
      )
    );
  return (result[0]?.count ?? 0) + 1;
}

router.get("/appointments", async (req, res): Promise<void> => {
  const query = ListAppointmentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.doctorId) conditions.push(eq(appointmentsTable.doctorId, query.data.doctorId));
  if (query.data.date) conditions.push(eq(appointmentsTable.appointmentDate, query.data.date as string));
  if (query.data.status) conditions.push(eq(appointmentsTable.status, query.data.status as string));

  const appointments = await db
    .select()
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(appointmentsTable.appointmentDate, appointmentsTable.timeSlot);

  res.json(
    appointments.map((row) => ({
      id: row.appointments.id,
      tokenNumber: row.appointments.tokenNumber ?? null,
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

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, parsed.data.doctorId));
  if (!doctor) {
    res.status(400).json({ error: "Doctor not found" });
    return;
  }

  const existing = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.doctorId, parsed.data.doctorId),
        eq(appointmentsTable.appointmentDate, parsed.data.appointmentDate),
        eq(appointmentsTable.timeSlot, parsed.data.timeSlot),
        sql`${appointmentsTable.status} != 'cancelled'`
      )
    );

  if ((existing[0]?.count ?? 0) >= doctor.maxPatientsPerSlot) {
    res.status(400).json({ error: "This time slot is full. Please choose a different slot." });
    return;
  }

  const tokenNumber = await assignTokenNumber(parsed.data.doctorId, parsed.data.appointmentDate);

  const [appointment] = await db
    .insert(appointmentsTable)
    .values({ ...parsed.data, tokenNumber })
    .returning();

  res.status(201).json(formatAppointment(appointment, doctor));
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const params = GetAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const row = await db
    .select()
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(eq(appointmentsTable.id, params.data.id));

  if (!row[0]) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  const { appointments: a, doctors: d } = row[0];
  res.json({
    id: a.id,
    tokenNumber: a.tokenNumber ?? null,
    patientName: a.patientName,
    patientPhone: a.patientPhone,
    doctorId: a.doctorId,
    doctorName: d?.name ?? "Unknown",
    doctorSpecialization: d?.specialization ?? "Unknown",
    appointmentDate: a.appointmentDate,
    timeSlot: a.timeSlot,
    status: a.status,
    notes: a.notes,
    createdAt: a.createdAt.toISOString(),
  });
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updates[k] = v;
  }
  const rowsBefore = await db
    .select()
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(eq(appointmentsTable.id, params.data.id));

  if (!rowsBefore[0]) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const [appointment] = await db
    .update(appointmentsTable)
    .set(updates)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  const { doctors: d } = rowsBefore[0];
  res.json({
    id: appointment.id,
    tokenNumber: appointment.tokenNumber ?? null,
    patientName: appointment.patientName,
    patientPhone: appointment.patientPhone,
    doctorId: appointment.doctorId,
    doctorName: d?.name ?? "Unknown",
    doctorSpecialization: d?.specialization ?? "Unknown",
    appointmentDate: appointment.appointmentDate,
    timeSlot: appointment.timeSlot,
    status: appointment.status,
    notes: appointment.notes,
    createdAt: appointment.createdAt.toISOString(),
  });
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const params = DeleteAppointmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [appointment] = await db
    .delete(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();
  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
