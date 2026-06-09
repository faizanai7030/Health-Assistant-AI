import { Router } from "express";
import { db, appointmentsTable, doctorsTable, waitlistTable, noShowLogTable, patientBlacklistTable, whatsappConversationsTable, whatsappMessagesTable, clinicsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { todayIST } from "../lib/date";
import { logger } from "../lib/logger";

const router = Router();

const NO_SHOW_THRESHOLD = 2;

async function notifyWaitlistPatient(
  clinicId: number,
  doctorId: number,
  doctorName: string,
  date: string,
  timeSlot: string,
  waitlistEntry: { id: number; patientName: string; patientPhone: string }
) {
  let conv = await db.select().from(whatsappConversationsTable)
    .where(and(eq(whatsappConversationsTable.clinicId, clinicId), eq(whatsappConversationsTable.patientPhone, waitlistEntry.patientPhone)))
    .then(r => r[0]);

  if (!conv) {
    const [created] = await db.insert(whatsappConversationsTable)
      .values({ clinicId, patientPhone: waitlistEntry.patientPhone, patientName: waitlistEntry.patientName })
      .returning();
    conv = created;
  }

  const msg = `Hi ${waitlistEntry.patientName}! 🎉\n\nGreat news! A slot has opened up with Dr. ${doctorName} on ${date} at ${timeSlot}.\n\nWould you like to book it? Please reply *YES* to confirm or *NO* to skip. The slot will be held for 30 minutes.`;

  await db.insert(whatsappMessagesTable).values({ conversationId: conv.id, role: "assistant", content: msg });
  await db.update(whatsappConversationsTable).set({ updatedAt: new Date() }).where(eq(whatsappConversationsTable.id, conv.id));
  logger.info({ waitlistEntry, doctorId, date, timeSlot }, "Waitlist patient notified of open slot");
}

async function sendFollowUpMessage(
  clinicId: number,
  patientPhone: string,
  patientName: string,
  doctorName: string
) {
  let conv = await db.select().from(whatsappConversationsTable)
    .where(and(eq(whatsappConversationsTable.clinicId, clinicId), eq(whatsappConversationsTable.patientPhone, patientPhone)))
    .then(r => r[0]);

  if (!conv) {
    const [created] = await db.insert(whatsappConversationsTable)
      .values({ clinicId, patientPhone, patientName })
      .returning();
    conv = created;
  }

  const msg = `Hi ${patientName}! 😊\n\nHope you're feeling better after your visit with Dr. ${doctorName}. 🙏\n\nIf you need a follow-up or have any concerns, just message us here and I'll book you in right away!\n\n— Priya`;

  await db.insert(whatsappMessagesTable).values({ conversationId: conv.id, role: "assistant", content: msg });
  await db.update(whatsappConversationsTable).set({ updatedAt: new Date() }).where(eq(whatsappConversationsTable.id, conv.id));
  logger.info({ clinicId, patientPhone, doctorName }, "Follow-up message sent to patient");
}

// PATCH /appointments/:id/visit-status — mark arrived/in_consultation/completed/no_show
router.patch("/appointments/:id/visit-status", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const id = parseInt(req.params["id"] ?? "0");
  const { visitStatus } = req.body as { visitStatus: string };

  const valid = ["scheduled", "arrived", "in_consultation", "completed", "no_show"];
  if (!valid.includes(visitStatus)) {
    res.status(400).json({ error: "Invalid visit status" });
    return;
  }

  const [apt] = await db.select().from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(and(eq(appointmentsTable.id, id), eq(appointmentsTable.clinicId, clinicId)));

  if (!apt) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  const updates: Record<string, unknown> = { visitStatus };
  if (visitStatus === "completed") updates["status"] = "completed";
  if (visitStatus === "no_show") updates["status"] = "cancelled";

  await db.update(appointmentsTable).set(updates).where(eq(appointmentsTable.id, id));

  // Feature 6 — track no-shows, blacklist after threshold
  if (visitStatus === "no_show") {
    await db.insert(noShowLogTable).values({
      clinicId,
      patientPhone: apt.appointments.patientPhone,
      patientName: apt.appointments.patientName,
      appointmentId: id,
    });

    const [noShowCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(noShowLogTable)
      .where(and(eq(noShowLogTable.clinicId, clinicId), eq(noShowLogTable.patientPhone, apt.appointments.patientPhone)));

    if ((noShowCount?.count ?? 0) >= NO_SHOW_THRESHOLD) {
      await db.insert(patientBlacklistTable).values({
        clinicId,
        patientPhone: apt.appointments.patientPhone,
        patientName: apt.appointments.patientName,
        reason: `Auto-blacklisted after ${noShowCount?.count} no-shows`,
        isActive: true,
      }).onConflictDoUpdate({
        target: [patientBlacklistTable.clinicId, patientBlacklistTable.patientPhone],
        set: { isActive: true, reason: `Auto-blacklisted after ${noShowCount?.count} no-shows` },
      });
      logger.info({ patientPhone: apt.appointments.patientPhone, clinicId }, "Patient auto-blacklisted for repeated no-shows");
    }

    // Feature 2 — check waitlist for this slot and notify next patient
    const [nextWaiting] = await db.select().from(waitlistTable)
      .where(and(
        eq(waitlistTable.clinicId, clinicId),
        eq(waitlistTable.doctorId, apt.appointments.doctorId),
        eq(waitlistTable.requestedDate, apt.appointments.appointmentDate),
        eq(waitlistTable.status, "waiting"),
      ))
      .orderBy(waitlistTable.createdAt)
      .limit(1);

    if (nextWaiting && apt.doctors) {
      await notifyWaitlistPatient(clinicId, apt.appointments.doctorId, apt.doctors.name, apt.appointments.appointmentDate, apt.appointments.timeSlot, nextWaiting);
      await db.update(waitlistTable).set({ status: "notified" }).where(eq(waitlistTable.id, nextWaiting.id));
    }
  }

  // Feature 3 — schedule follow-up message if follow_up_days is set and status is completed
  if (visitStatus === "completed" && apt.appointments.followUpDays && apt.doctors) {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + apt.appointments.followUpDays);
    // Store follow-up as a scheduled message by adding it to conversation now with a note
    // In a real deployment this would be a cron job — here we log it so it can be triggered manually
    logger.info({ patientPhone: apt.appointments.patientPhone, followUpDays: apt.appointments.followUpDays, followUpDate }, "Follow-up scheduled");

    // For demo / current implementation: send immediately if followUpDays === 0, else log
    if (apt.appointments.followUpDays <= 1) {
      await sendFollowUpMessage(clinicId, apt.appointments.patientPhone, apt.appointments.patientName, apt.doctors.name);
    }
  }

  res.json({ ok: true, visitStatus, id });
});

// PATCH /appointments/:id/follow-up — set follow-up days
router.patch("/appointments/:id/follow-up", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const id = parseInt(req.params["id"] ?? "0");
  const { followUpDays } = req.body as { followUpDays: number };

  const [apt] = await db.select().from(appointmentsTable)
    .where(and(eq(appointmentsTable.id, id), eq(appointmentsTable.clinicId, clinicId)));

  if (!apt) { res.status(404).json({ error: "Appointment not found" }); return; }

  await db.update(appointmentsTable).set({ followUpDays: followUpDays ?? null }).where(eq(appointmentsTable.id, id));
  res.json({ ok: true });
});

// GET /waitlist — list all waitlist entries
router.get("/waitlist", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const rows = await db.select().from(waitlistTable)
    .leftJoin(doctorsTable, eq(waitlistTable.doctorId, doctorsTable.id))
    .where(eq(waitlistTable.clinicId, clinicId))
    .orderBy(waitlistTable.createdAt);

  res.json(rows.map(r => ({
    id: r.waitlist.id,
    patientName: r.waitlist.patientName,
    patientPhone: r.waitlist.patientPhone,
    doctorId: r.waitlist.doctorId,
    doctorName: r.doctors?.name ?? "Unknown",
    requestedDate: r.waitlist.requestedDate,
    notes: r.waitlist.notes,
    status: r.waitlist.status,
    createdAt: r.waitlist.createdAt.toISOString(),
  })));
});

// POST /waitlist — add patient to waitlist
router.post("/waitlist", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const { patientName, patientPhone, doctorId, requestedDate, notes } = req.body as {
    patientName: string; patientPhone: string; doctorId: number; requestedDate: string; notes?: string;
  };

  if (!patientName || !patientPhone || !doctorId || !requestedDate) {
    res.status(400).json({ error: "patientName, patientPhone, doctorId, requestedDate are required" });
    return;
  }

  const [row] = await db.insert(waitlistTable).values({ clinicId, patientName, patientPhone, doctorId, requestedDate, notes: notes ?? null, status: "waiting" }).returning();
  res.status(201).json(row);
});

// DELETE /waitlist/:id — remove from waitlist
router.delete("/waitlist/:id", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const id = parseInt(req.params["id"] ?? "0");
  await db.delete(waitlistTable).where(and(eq(waitlistTable.id, id), eq(waitlistTable.clinicId, clinicId)));
  res.sendStatus(204);
});

// GET /patients/blacklist — list blacklisted patients
router.get("/patients/blacklist", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const rows = await db.select().from(patientBlacklistTable)
    .where(and(eq(patientBlacklistTable.clinicId, clinicId), eq(patientBlacklistTable.isActive, true)))
    .orderBy(patientBlacklistTable.createdAt);
  res.json(rows);
});

// DELETE /patients/blacklist/:id — whitelist (remove from blacklist)
router.delete("/patients/blacklist/:id", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const id = parseInt(req.params["id"] ?? "0");
  await db.update(patientBlacklistTable).set({ isActive: false })
    .where(and(eq(patientBlacklistTable.id, id), eq(patientBlacklistTable.clinicId, clinicId)));
  res.json({ ok: true });
});

// GET /analytics — real clinic analytics
router.get("/analytics", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const today = todayIST();

  // No-show rate (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const [totalLast30] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), sql`${appointmentsTable.appointmentDate} >= ${thirtyDaysAgoStr}`));

  const [noShowLast30] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), sql`${appointmentsTable.appointmentDate} >= ${thirtyDaysAgoStr}`, eq(appointmentsTable.visitStatus, "no_show")));

  const [completedLast30] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), sql`${appointmentsTable.appointmentDate} >= ${thirtyDaysAgoStr}`, eq(appointmentsTable.visitStatus, "completed")));

  const total30 = totalLast30?.count ?? 0;
  const noShow30 = noShowLast30?.count ?? 0;
  const noShowRate = total30 > 0 ? Math.round((noShow30 / total30) * 100) : 0;
  const completionRate = total30 > 0 ? Math.round(((completedLast30?.count ?? 0) / total30) * 100) : 0;

  // Slot utilization per doctor today
  const doctorStats = await db.select({
    doctorId: appointmentsTable.doctorId,
    doctorName: doctorsTable.name,
    specialization: doctorsTable.specialization,
    total: sql<number>`count(*)::int`,
    completed: sql<number>`sum(case when ${appointmentsTable.visitStatus} = 'completed' then 1 else 0 end)::int`,
    noShows: sql<number>`sum(case when ${appointmentsTable.visitStatus} = 'no_show' then 1 else 0 end)::int`,
  }).from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(and(eq(appointmentsTable.clinicId, clinicId), sql`${appointmentsTable.appointmentDate} >= ${thirtyDaysAgoStr}`))
    .groupBy(appointmentsTable.doctorId, doctorsTable.name, doctorsTable.specialization);

  // Peak booking hours (when appointments are created)
  const hourlyStats = await db.select({
    hour: sql<number>`extract(hour from ${appointmentsTable.createdAt} at time zone 'Asia/Kolkata')::int`,
    count: sql<number>`count(*)::int`,
  }).from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), sql`${appointmentsTable.appointmentDate} >= ${thirtyDaysAgoStr}`))
    .groupBy(sql`extract(hour from ${appointmentsTable.createdAt} at time zone 'Asia/Kolkata')`)
    .orderBy(sql`extract(hour from ${appointmentsTable.createdAt} at time zone 'Asia/Kolkata')`);

  // Returning vs new patients (last 30 days)
  const patientsLast30 = await db.select({ patientPhone: appointmentsTable.patientPhone })
    .from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), sql`${appointmentsTable.appointmentDate} >= ${thirtyDaysAgoStr}`));

  const uniquePhonesLast30 = new Set(patientsLast30.map(p => p.patientPhone));
  const returningCount = await Promise.all([...uniquePhonesLast30].map(async phone => {
    const [prev] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable)
      .where(and(eq(appointmentsTable.clinicId, clinicId), eq(appointmentsTable.patientPhone, phone), sql`${appointmentsTable.appointmentDate} < ${thirtyDaysAgoStr}`));
    return (prev?.count ?? 0) > 0 ? 1 : 0;
  }));
  const returningPatients = returningCount.reduce((a, b) => a + b, 0);
  const returnRate = uniquePhonesLast30.size > 0 ? Math.round((returningPatients / uniquePhonesLast30.size) * 100) : 0;

  // Appointments per day last 14 days
  const dailyTrend = await db.select({
    date: appointmentsTable.appointmentDate,
    count: sql<number>`count(*)::int`,
  }).from(appointmentsTable)
    .where(and(eq(appointmentsTable.clinicId, clinicId), sql`${appointmentsTable.appointmentDate} >= ${new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0]}`))
    .groupBy(appointmentsTable.appointmentDate)
    .orderBy(appointmentsTable.appointmentDate);

  // Waitlist size
  const [waitlistCount] = await db.select({ count: sql<number>`count(*)::int` }).from(waitlistTable)
    .where(and(eq(waitlistTable.clinicId, clinicId), eq(waitlistTable.status, "waiting")));

  // Blacklisted patients
  const [blacklistCount] = await db.select({ count: sql<number>`count(*)::int` }).from(patientBlacklistTable)
    .where(and(eq(patientBlacklistTable.clinicId, clinicId), eq(patientBlacklistTable.isActive, true)));

  res.json({
    period: "Last 30 days",
    noShowRate,
    completionRate,
    totalAppointments: total30,
    returningPatientRate: returnRate,
    waitlistSize: waitlistCount?.count ?? 0,
    blacklistedPatients: blacklistCount?.count ?? 0,
    doctorStats: doctorStats.map(d => ({
      doctorId: d.doctorId,
      doctorName: d.doctorName ?? "Unknown",
      specialization: d.specialization ?? "",
      total: d.total ?? 0,
      completed: d.completed ?? 0,
      noShows: d.noShows ?? 0,
    })),
    peakHours: hourlyStats,
    dailyTrend,
  });
});

export default router;
