import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, doctorsTable } from "@workspace/db";
import {
  CreateDoctorBody,
  UpdateDoctorBody,
  GetDoctorParams,
  UpdateDoctorParams,
  DeleteDoctorParams,
  GetDoctorAvailabilityParams,
  GetDoctorAvailabilityQueryParams,
} from "@workspace/api-zod";
import { sql, and } from "drizzle-orm";
import { appointmentsTable } from "@workspace/db";

const router: IRouter = Router();

function generateTimeSlots(start: string, end: string, durationMinutes: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  let current = startH * 60 + startM;
  const endTotal = endH * 60 + endM;
  while (current < endTotal) {
    const h = Math.floor(current / 60).toString().padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += durationMinutes;
  }
  return slots;
}

router.get("/doctors", async (_req, res): Promise<void> => {
  const doctors = await db.select().from(doctorsTable).orderBy(doctorsTable.name);
  res.json(doctors.map((d) => ({ ...d, isActive: d.isActive, createdAt: d.createdAt.toISOString() })));
});

router.post("/doctors", async (req, res): Promise<void> => {
  const parsed = CreateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [doctor] = await db.insert(doctorsTable).values(parsed.data).returning();
  res.status(201).json({ ...doctor, createdAt: doctor.createdAt.toISOString() });
});

router.get("/doctors/:id", async (req, res): Promise<void> => {
  const params = GetDoctorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, params.data.id));
  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }
  res.json({ ...doctor, createdAt: doctor.createdAt.toISOString() });
});

router.patch("/doctors/:id", async (req, res): Promise<void> => {
  const params = UpdateDoctorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDoctorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updates[k] = v;
  }
  const [doctor] = await db.update(doctorsTable).set(updates).where(eq(doctorsTable.id, params.data.id)).returning();
  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }
  res.json({ ...doctor, createdAt: doctor.createdAt.toISOString() });
});

router.delete("/doctors/:id", async (req, res): Promise<void> => {
  const params = DeleteDoctorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [doctor] = await db.delete(doctorsTable).where(eq(doctorsTable.id, params.data.id)).returning();
  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/doctors/:id/availability", async (req, res): Promise<void> => {
  const params = GetDoctorAvailabilityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const query = GetDoctorAvailabilityQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, params.data.id));
  if (!doctor) {
    res.status(404).json({ error: "Doctor not found" });
    return;
  }

  const date = query.data.date as string;
  const slots = generateTimeSlots(doctor.workingHoursStart, doctor.workingHoursEnd, doctor.slotDurationMinutes);

  const booked = await db
    .select({ timeSlot: appointmentsTable.timeSlot, count: sql<number>`count(*)::int` })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.doctorId, doctor.id),
        eq(appointmentsTable.appointmentDate, date),
        sql`${appointmentsTable.status} != 'cancelled'`
      )
    )
    .groupBy(appointmentsTable.timeSlot);

  const bookedMap = new Map(booked.map((b) => [b.timeSlot, b.count]));

  const slotData = slots.map((time) => {
    const bookedCount = bookedMap.get(time) ?? 0;
    return {
      time,
      bookedCount,
      maxCapacity: doctor.maxPatientsPerSlot,
      isAvailable: bookedCount < doctor.maxPatientsPerSlot,
    };
  });

  res.json({ doctorId: doctor.id, date, slots: slotData });
});

export default router;
