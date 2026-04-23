import { Router } from "express";
import { db, appointmentRemindersTable, appointmentsTable, doctorsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/reminders", async (req, res) => {
  const clinicId = req.clinicId!;
  const status = req.query["status"] as string | undefined;

  const rows = await db.select().from(appointmentRemindersTable)
    .where(eq(appointmentRemindersTable.clinicId, clinicId))
    .orderBy(appointmentRemindersTable.scheduledFor);

  if (status) {
    res.json(rows.filter((r) => r.status === status));
  } else {
    res.json(rows);
  }
});

router.post("/reminders", async (req, res) => {
  const clinicId = req.clinicId!;
  const { appointmentId, reminderMinutesBefore = 60 } = req.body as {
    appointmentId: number;
    reminderMinutesBefore?: number;
  };

  const appts = await db
    .select({
      id: appointmentsTable.id,
      patientName: appointmentsTable.patientName,
      patientPhone: appointmentsTable.patientPhone,
      doctorId: appointmentsTable.doctorId,
      appointmentDate: appointmentsTable.appointmentDate,
      timeSlot: appointmentsTable.timeSlot,
      doctorName: doctorsTable.name,
    })
    .from(appointmentsTable)
    .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(eq(appointmentsTable.id, appointmentId));

  const appt = appts[0];
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  const [h, m] = appt.timeSlot.split(":").map(Number);
  const apptDateTime = new Date(`${appt.appointmentDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const scheduledFor = new Date(apptDateTime.getTime() - reminderMinutesBefore * 60 * 1000);

  const reminderMessage = `Dear ${appt.patientName}, this is a reminder that your appointment with ${appt.doctorName} is scheduled for ${appt.appointmentDate} at ${appt.timeSlot}. Please arrive 10 minutes early.`;

  const [row] = await db.insert(appointmentRemindersTable).values({
    clinicId,
    appointmentId,
    patientName: appt.patientName,
    patientPhone: appt.patientPhone,
    doctorName: appt.doctorName,
    appointmentDate: appt.appointmentDate,
    timeSlot: appt.timeSlot,
    reminderMessage,
    status: "pending",
    scheduledFor,
  }).returning();

  res.status(201).json(row);
});

router.patch("/reminders/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  const { status } = req.body as { status: string };

  const [updated] = await db
    .update(appointmentRemindersTable)
    .set({ status })
    .where(eq(appointmentRemindersTable.id, id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Reminder not found" });
  res.json(updated);
});

router.post("/reminders/generate-today", async (req, res) => {
  const clinicId = req.clinicId!;
  const today = new Date().toISOString().split("T")[0];

  const todayAppts = await db
    .select({
      id: appointmentsTable.id,
      patientName: appointmentsTable.patientName,
      patientPhone: appointmentsTable.patientPhone,
      appointmentDate: appointmentsTable.appointmentDate,
      timeSlot: appointmentsTable.timeSlot,
      doctorName: doctorsTable.name,
    })
    .from(appointmentsTable)
    .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.appointmentDate, today),
        eq(appointmentsTable.status, "scheduled")
      )
    );

  const existing = await db
    .select({ appointmentId: appointmentRemindersTable.appointmentId })
    .from(appointmentRemindersTable)
    .where(and(eq(appointmentRemindersTable.clinicId, clinicId), eq(appointmentRemindersTable.status, "pending")));

  const existingIds = new Set(existing.map((e) => e.appointmentId));

  let created = 0;
  let skipped = 0;

  for (const appt of todayAppts) {
    if (existingIds.has(appt.id)) {
      skipped++;
      continue;
    }

    const [h, m] = appt.timeSlot.split(":").map(Number);
    const apptDateTime = new Date(`${appt.appointmentDate}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
    const scheduledFor = new Date(apptDateTime.getTime() - 60 * 60 * 1000);

    const reminderMessage = `Dear ${appt.patientName}, this is a reminder that your appointment with ${appt.doctorName} is scheduled today at ${appt.timeSlot}. Please arrive 10 minutes early.`;

    await db.insert(appointmentRemindersTable).values({
      clinicId,
      appointmentId: appt.id,
      patientName: appt.patientName,
      patientPhone: appt.patientPhone,
      doctorName: appt.doctorName,
      appointmentDate: appt.appointmentDate,
      timeSlot: appt.timeSlot,
      reminderMessage,
      status: "pending",
      scheduledFor,
    });

    created++;
  }

  res.json({ created, skipped });
});

export default router;
