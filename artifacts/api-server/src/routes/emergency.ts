import { Router } from "express";
import { db, doctorsTable, doctorEmergenciesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const todayStr = () => new Date().toISOString().split("T")[0];

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
  const { type, message } = req.body as { type: string; message?: string };
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
  }).returning();

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
