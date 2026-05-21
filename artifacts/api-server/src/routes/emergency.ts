import { Router } from "express";
import { db, doctorsTable, doctorEmergenciesTable, clinicsTable, appointmentsTable, whatsappConversationsTable, whatsappMessagesTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { todayIST } from "../lib/date";

const router = Router();

const todayStr = () => todayIST();

async function notifyPatientsOfEmergency(
  clinicId: number,
  doctorId: number,
  doctorName: string,
  clinicName: string,
  type: "late" | "absent",
  lateByMinutes?: number | null
) {
  const today = todayStr();

  const appointments = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.doctorId, doctorId),
        eq(appointmentsTable.appointmentDate, today),
        ne(appointmentsTable.status, "cancelled")
      )
    );

  for (const appt of appointments) {
    if (!appt.patientPhone) continue;

    let conv = await db
      .select()
      .from(whatsappConversationsTable)
      .where(
        and(
          eq(whatsappConversationsTable.clinicId, clinicId),
          eq(whatsappConversationsTable.patientPhone, appt.patientPhone)
        )
      )
      .then((r) => r[0]);

    if (!conv) {
      const [created] = await db
        .insert(whatsappConversationsTable)
        .values({ clinicId, patientPhone: appt.patientPhone, patientName: appt.patientName })
        .returning();
      conv = created;
    }

    let notificationText: string;
    if (type === "late") {
      const delayLabel = lateByMinutes === 15 ? "15 minutes"
        : lateByMinutes === 30 ? "30 minutes"
        : lateByMinutes === 60 ? "1 hour"
        : lateByMinutes === 120 ? "2 hours"
        : "some time";
      notificationText =
        `Hi ${appt.patientName}! 🙏\n\n` +
        `Update from ${clinicName}: Dr. ${doctorName} is running approximately *${delayLabel} late* today.\n\n` +
        `Your appointment is still confirmed — please arrive a little later than your scheduled time. ` +
        `Sorry for the inconvenience! 🙏`;
    } else {
      notificationText =
        `Hi ${appt.patientName}! 🙏\n\n` +
        `Important update from ${clinicName}: Unfortunately, Dr. ${doctorName} will *not be available today* due to an emergency.\n\n` +
        `Please contact us to reschedule your appointment. We sincerely apologize for the inconvenience. 🙏`;
    }

    await db.insert(whatsappMessagesTable).values({
      conversationId: conv.id,
      role: "assistant",
      content: notificationText,
    });

    await db
      .update(whatsappConversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(whatsappConversationsTable.id, conv.id));
  }
}

router.get("/doctors/emergency-today", async (req, res) => {
  const clinicId = req.clinicId!;
  const today = todayStr();
  const rows = await db
    .select({
      id: doctorEmergenciesTable.id,
      doctorId: doctorEmergenciesTable.doctorId,
      doctorName: doctorsTable.name,
      date: doctorEmergenciesTable.date,
      type: doctorEmergenciesTable.type,
      message: doctorEmergenciesTable.message,
      lateByMinutes: doctorEmergenciesTable.lateByMinutes,
      createdAt: doctorEmergenciesTable.createdAt,
    })
    .from(doctorEmergenciesTable)
    .innerJoin(doctorsTable, eq(doctorEmergenciesTable.doctorId, doctorsTable.id))
    .where(and(eq(doctorEmergenciesTable.clinicId, clinicId), eq(doctorEmergenciesTable.date, today)));

  res.json(rows);
});

router.post("/doctors/:id/emergency", async (req, res) => {
  const clinicId = req.clinicId!;
  const doctorId = Number(req.params["id"]);
  const { type, message, lateByMinutes } = req.body as { type: string; message?: string; lateByMinutes?: number };
  const today = todayStr();

  const doctor = await db.select().from(doctorsTable)
    .where(and(eq(doctorsTable.id, doctorId), eq(doctorsTable.clinicId, clinicId)));
  if (!doctor[0]) return res.status(404).json({ error: "Doctor not found" });

  await db
    .delete(doctorEmergenciesTable)
    .where(
      and(
        eq(doctorEmergenciesTable.clinicId, clinicId),
        eq(doctorEmergenciesTable.doctorId, doctorId),
        eq(doctorEmergenciesTable.date, today)
      )
    );

  const [row] = await db.insert(doctorEmergenciesTable).values({
    clinicId,
    doctorId,
    date: today,
    type,
    message: message ?? null,
    lateByMinutes: lateByMinutes ?? null,
  }).returning();

  const clinics = await db.select().from(clinicsTable).where(eq(clinicsTable.id, clinicId));
  const clinicName = clinics[0]?.name ?? "the clinic";

  await notifyPatientsOfEmergency(
    clinicId,
    doctorId,
    doctor[0].name,
    clinicName,
    type as "late" | "absent",
    lateByMinutes
  );

  res.json({ ...row, doctorName: doctor[0].name });
});

router.delete("/doctors/:id/emergency", async (req, res) => {
  const clinicId = req.clinicId!;
  const doctorId = Number(req.params["id"]);
  const today = todayStr();

  await db
    .delete(doctorEmergenciesTable)
    .where(
      and(
        eq(doctorEmergenciesTable.clinicId, clinicId),
        eq(doctorEmergenciesTable.doctorId, doctorId),
        eq(doctorEmergenciesTable.date, today)
      )
    );

  res.status(204).send();
});

export default router;
