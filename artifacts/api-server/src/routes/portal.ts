import { Router } from "express";
import { db, doctorsTable, appointmentsTable, doctorEmergenciesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const todayStr = () => new Date().toISOString().split("T")[0];

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
  const { type, message } = req.body as { type: string; message?: string };

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
    doctorId: doctor.id,
    date: today,
    type,
    message: message ?? null,
  }).returning();

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
