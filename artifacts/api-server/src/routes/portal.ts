import { Router } from "express";
import { db, doctorsTable, appointmentsTable, doctorEmergenciesTable, clinicsTable, whatsappConversationsTable, whatsappMessagesTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";

const router = Router();

const todayStr = () => new Date().toISOString().split("T")[0];

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

router.get("/doctors/portal/:token", async (req, res) => {
  const token = req.params["token"];
  const today = todayStr();

  const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.portalToken, token));
  const doctor = doctors[0];
  if (!doctor) return res.status(404).json({ error: "Invalid portal link" });

  const todayAppointments = await db
    .select()
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.doctorId, doctor.id),
        eq(appointmentsTable.appointmentDate, today)
      )
    )
    .orderBy(appointmentsTable.timeSlot);

  const enriched = todayAppointments.map((a) => ({
    ...a,
    doctorName: doctor.name,
    doctorSpecialization: doctor.specialization,
  }));

  const emergencies = await db
    .select()
    .from(doctorEmergenciesTable)
    .where(
      and(
        eq(doctorEmergenciesTable.doctorId, doctor.id),
        eq(doctorEmergenciesTable.date, today)
      )
    );

  res.json({
    doctor,
    todayAppointments: enriched,
    emergencyToday: emergencies[0] ? { ...emergencies[0], doctorName: doctor.name } : null,
  });
});

router.post("/doctors/portal/:token/emergency", async (req, res) => {
  const token = req.params["token"];
  const today = todayStr();
  const { type, message, lateByMinutes } = req.body as { type: string; message?: string; lateByMinutes?: number };

  const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.portalToken, token));
  const doctor = doctors[0];
  if (!doctor) return res.status(404).json({ error: "Invalid portal link" });

  await db
    .delete(doctorEmergenciesTable)
    .where(
      and(
        eq(doctorEmergenciesTable.doctorId, doctor.id),
        eq(doctorEmergenciesTable.date, today)
      )
    );

  const [row] = await db.insert(doctorEmergenciesTable).values({
    clinicId: doctor.clinicId,
    doctorId: doctor.id,
    date: today,
    type,
    message: message ?? null,
    lateByMinutes: lateByMinutes ?? null,
  }).returning();

  const clinics = await db.select().from(clinicsTable).where(eq(clinicsTable.id, doctor.clinicId!));
  const clinicName = clinics[0]?.name ?? "the clinic";

  await notifyPatientsOfEmergency(
    doctor.clinicId!,
    doctor.id,
    doctor.name,
    clinicName,
    type as "late" | "absent",
    lateByMinutes
  );

  res.json({ ...row, doctorName: doctor.name });
});

router.delete("/doctors/portal/:token/emergency", async (req, res) => {
  const token = req.params["token"];
  const today = todayStr();

  const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.portalToken, token));
  const doctor = doctors[0];
  if (!doctor) return res.status(404).json({ error: "Invalid portal link" });

  await db
    .delete(doctorEmergenciesTable)
    .where(
      and(
        eq(doctorEmergenciesTable.doctorId, doctor.id),
        eq(doctorEmergenciesTable.date, today)
      )
    );

  res.status(204).send();
});

export default router;
