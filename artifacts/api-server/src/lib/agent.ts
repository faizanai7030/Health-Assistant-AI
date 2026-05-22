import { openai } from "@workspace/integrations-openai-ai-server";
import { db, doctorsTable, appointmentsTable, doctorEmergenciesTable, doctorLeavesTable } from "@workspace/db";
import { eq, and, sql, gte } from "drizzle-orm";
import { logger } from "./logger";
import { todayIST, nextDaysIST } from "./date";

async function withRetry<T>(fn: () => Promise<T>, retries = 4, delayMs = 500): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      const isRetryable = status === 429 || status === 500 || status === 503;
      if (!isRetryable || attempt === retries) throw err;
      const wait = delayMs * Math.pow(2, attempt);
      logger.warn({ attempt, wait, status }, "OpenAI retryable error — retrying");
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw new Error("withRetry exhausted");
}

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

async function getTodayEmergencies(clinicId: number): Promise<Map<number, { type: string; message: string | null }>> {
  const today = todayIST();
  const rows = await db
    .select()
    .from(doctorEmergenciesTable)
    .where(and(eq(doctorEmergenciesTable.clinicId, clinicId), eq(doctorEmergenciesTable.date, today)));

  const map = new Map<number, { type: string; message: string | null }>();
  for (const row of rows) {
    map.set(row.doctorId, { type: row.type, message: row.message ?? null });
  }
  return map;
}

export async function getAvailabilityContext(clinicId: number, date: string): Promise<string> {
  const doctors = await db.select().from(doctorsTable)
    .where(and(eq(doctorsTable.clinicId, clinicId), eq(doctorsTable.isActive, true)));
  const dateObj = new Date(date + "T00:00:00+05:30");
  const dayOfWeek = dateObj.getDay();
  const today = todayIST();
  const emergencies = date === today ? await getTodayEmergencies(clinicId) : new Map();

  const leavesOnDate = await db.select().from(doctorLeavesTable)
    .where(and(eq(doctorLeavesTable.clinicId, clinicId), eq(doctorLeavesTable.leaveDate, date)));
  const onLeaveSet = new Set(leavesOnDate.map((l) => l.doctorId));

  const lines: string[] = [`Availability for ${date}:`];

  for (const doc of doctors) {
    const emergency = emergencies.get(doc.id);

    if (emergency) {
      if (emergency.type === "absent") {
        lines.push(`- ${doc.name} (${doc.specialization}): EMERGENCY - Doctor is NOT coming today. Do not book.`);
        continue;
      }
      if (emergency.type === "paused") {
        lines.push(`- ${doc.name} (${doc.specialization}): AI BOOKINGS PAUSED by doctor for today. Do NOT accept any new booking requests for this doctor today. If patient asks, say the doctor is not taking new appointments today and suggest coming in person or trying tomorrow.`);
        continue;
      }
      if (emergency.type === "late") {
        lines.push(`- ${doc.name} (${doc.specialization}): EMERGENCY - Doctor will be late today. Use caution when booking early slots.`);
      }
    }

    if (onLeaveSet.has(doc.id)) {
      const leave = leavesOnDate.find((l) => l.doctorId === doc.id);
      const reason = leave?.reason ? ` (${leave.reason})` : "";
      lines.push(`- ${doc.name} (${doc.specialization}): On leave${reason}. Do not book.`);
      continue;
    }

    const workingDays = doc.workingDays.split(",").map(Number);
    if (!workingDays.includes(dayOfWeek)) {
      lines.push(`- ${doc.name} (${doc.specialization}): Not working on this day`);
      continue;
    }

    const slots = generateTimeSlots(doc.workingHoursStart, doc.workingHoursEnd, doc.slotDurationMinutes);
    const booked = await db
      .select({ timeSlot: appointmentsTable.timeSlot, count: sql<number>`count(*)::int` })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.doctorId, doc.id),
          eq(appointmentsTable.appointmentDate, date),
          sql`${appointmentsTable.status} != 'cancelled'`
        )
      )
      .groupBy(appointmentsTable.timeSlot);

    const bookedMap = new Map(booked.map((b) => [b.timeSlot, b.count]));
    const available = slots.filter((s) => (bookedMap.get(s) ?? 0) < doc.maxPatientsPerSlot);
    const fullSlots = slots.filter((s) => (bookedMap.get(s) ?? 0) >= doc.maxPatientsPerSlot);

    if (available.length === 0) {
      lines.push(`- ${doc.name} (${doc.specialization}): Fully booked`);
    } else {
      const fullyBookedNote = fullSlots.length > 0 ? ` Full slots (unavailable): ${fullSlots.join(", ")}.` : "";
      lines.push(`- ${doc.name} (${doc.specialization}): Arrives ${doc.workingHoursStart}, available until ${doc.workingHoursEnd} (${doc.slotDurationMinutes}-min slots).${fullyBookedNote} When patient picks a time, round to nearest valid slot.`);
    }
  }

  return lines.join("\n");
}

async function getPatientUpcomingAppointments(clinicId: number, patientPhone: string) {
  const today = todayIST();
  const rows = await db
    .select({
      id: appointmentsTable.id,
      doctorId: appointmentsTable.doctorId,
      doctorName: doctorsTable.name,
      appointmentDate: appointmentsTable.appointmentDate,
      timeSlot: appointmentsTable.timeSlot,
      status: appointmentsTable.status,
      patientName: appointmentsTable.patientName,
      tokenNumber: appointmentsTable.tokenNumber,
    })
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.patientPhone, patientPhone),
        sql`${appointmentsTable.status} != 'cancelled'`,
        gte(appointmentsTable.appointmentDate, today)
      )
    )
    .orderBy(appointmentsTable.appointmentDate, appointmentsTable.timeSlot);
  return rows;
}

interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function processWhatsAppMessage(
  clinicId: number,
  patientPhone: string,
  userMessage: string,
  conversationHistory: ConversationMessage[]
): Promise<{ reply: string; appointmentBooked: boolean; patientName: string | null; appointmentCancelled: boolean }> {
  const today = todayIST();
  const nextDays = nextDaysIST(7);

  const [availabilities, doctors, patientAppointments] = await Promise.all([
    Promise.all(nextDays.map((d) => getAvailabilityContext(clinicId, d))),
    db.select().from(doctorsTable).where(and(eq(doctorsTable.clinicId, clinicId), eq(doctorsTable.isActive, true))),
    getPatientUpcomingAppointments(clinicId, patientPhone),
  ]);

  const doctorList = doctors
    .map((d) => `${d.name} (ID: ${d.id}, ${d.specialization})`)
    .join("\n");

  const patientAppointmentsSection = patientAppointments.length > 0
    ? `\nThis patient's upcoming appointments:\n${patientAppointments
        .map((a) => `- ID:${a.id} | Dr. ${a.doctorName} | ${a.appointmentDate} at ${a.timeSlot} | Status: ${a.status}`)
        .join("\n")}`
    : `\nThis patient has no upcoming appointments.`;

  const systemPrompt = `You are Priya, the friendly WhatsApp receptionist for this clinic. You talk to patients in a warm, natural, human way — just like a real person would chat on WhatsApp.

Today's date: ${today}
Patient's WhatsApp: ${patientPhone}
${patientAppointmentsSection}

Doctors at this clinic:
${doctorList}

${availabilities.join("\n\n")}

━━━ HOW YOU TALK ━━━
- Sound like a real human typing on WhatsApp, not a robot
- Keep messages short and conversational — like how people actually text
- Use a warm, caring tone — patients may be worried or unwell
- Don't use bullet points or formal language
- It's okay to use "ok", "sure", "np", "just let me know" naturally
- You can use a few friendly words in Hindi/Urdu if the patient types in that language (like "ji", "theek hai", "bilkul")
- ALWAYS detect the patient's language and reply in the SAME language they're using
- If they write in Hindi — reply in Hindi. If Urdu — reply in Urdu. If English — reply in English.

━━━ WHAT YOU DO ━━━
1. Greet them warmly and ask what they need
2. Find out: which doctor (or what kind of doctor) and what date
3. Once you know the doctor, tell the patient simply: "Dr. X comes at [arrival time] and is available until [end time]. What time works for you?" — do NOT list out all the individual slots
4. If a doctor has EMERGENCY - NOT COMING TODAY: Say clearly "Dr. [Name] is not available today" and ONLY suggest other available doctors for today, or offer that same doctor on a future date — NEVER attempt to book this doctor for today
5. If a doctor has EMERGENCY - WILL BE LATE: warn the patient about the delay before booking early slots and ask if they still want to proceed
6. When the patient says a time, check the availability info: round to the nearest valid slot boundary and confirm if it's free. If that slot is full, suggest the next available time naturally in conversation.
7. If NO doctors are working on the requested date (e.g. Sunday / holiday): look through the next 7 days of availability shown above and tell the patient the next date when doctors ARE available. Be specific — name the date. Example: "Sunday is a holiday for the clinic, but Dr. X is available on Monday (17th). Want to book then?"
8. If a doctor is FULLY BOOKED for the requested date: check the next 7 days of availability shown above and tell the patient the next date that doctor has open slots. Example: "Dr. X is fully booked on the 16th, but has slots open on the 17th. Want to book then?"
9. Once you have everything (name, doctor ID, date, time): book it using the BOOK ACTION below
10. After booking, give them a warm confirmation with all the details

━━━ CANCELLATION ━━━
If a patient asks to cancel their appointment:
1. Look at "This patient's upcoming appointments" above
2. If they have one appointment, say: "I found your appointment with Dr. [name] on [date] at [time]. Are you sure you want to cancel it? Please reply *Yes* to confirm."
3. If they have multiple appointments, ask which one they want to cancel
4. If they have no appointments, tell them kindly there's nothing to cancel
5. Once they confirm (reply "yes" or similar), cancel it using the CANCEL ACTION below then send a kind farewell message

━━━ BOOKING ACTION ━━━
When you're ready to book, put this EXACT format on its own line (the system will parse it silently):
ACTION:{"type":"BOOK_APPOINTMENT","patientName":"...","patientPhone":"${patientPhone}","doctorId":NUMBER,"appointmentDate":"YYYY-MM-DD","timeSlot":"HH:MM","notes":"..."}

Then after that line, send your friendly confirmation message to the patient — always address them by their name in the confirmation.

━━━ CANCEL ACTION ━━━
When the patient confirms cancellation, put this EXACT format on its own line:
ACTION:{"type":"CANCEL_APPOINTMENT","appointmentId":NUMBER}

Then send a warm message like "Done! Your appointment has been cancelled. Hope to see you again soon! 😊"

IMPORTANT: Only book when you have ALL of: patient name, doctor ID, date, time slot. Only cancel after patient explicitly confirms.`;

  const messages: ConversationMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-12),
    { role: "user", content: userMessage },
  ];

  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 600,
      messages,
    })
  );

  const rawReply = response.choices[0]?.message?.content ?? "Sorry, I couldn't process that. Could you try again? 🙏";

  let appointmentBooked = false;
  let appointmentCancelled = false;
  let bookedTokenNumber: number | null = null;
  let bookedPatientName: string | null = null;

  if (rawReply.includes("ACTION:")) {
    const actionLine = rawReply.split("\n").find((l) => l.startsWith("ACTION:"));
    if (actionLine) {
      try {
        const jsonStr = actionLine.replace("ACTION:", "").trim();
        const action = JSON.parse(jsonStr);

        if (action.type === "BOOK_APPOINTMENT") {
          const conflictCheck = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(appointmentsTable)
            .where(
              and(
                eq(appointmentsTable.clinicId, clinicId),
                eq(appointmentsTable.doctorId, action.doctorId),
                eq(appointmentsTable.appointmentDate, action.appointmentDate),
                eq(appointmentsTable.timeSlot, action.timeSlot),
                sql`${appointmentsTable.status} != 'cancelled'`
              )
            );

          const doctor = doctors.find((d) => d.id === action.doctorId);
          const currentCount = conflictCheck[0]?.count ?? 0;

          if (doctor && currentCount < doctor.maxPatientsPerSlot) {
            const tokenCountResult = await db
              .select({ count: sql<number>`count(*)::int` })
              .from(appointmentsTable)
              .where(
                and(
                  eq(appointmentsTable.clinicId, clinicId),
                  eq(appointmentsTable.doctorId, action.doctorId),
                  eq(appointmentsTable.appointmentDate, action.appointmentDate),
                  sql`${appointmentsTable.status} != 'cancelled'`
                )
              );
            const tokenNumber = (tokenCountResult[0]?.count ?? 0) + 1;

            await db.insert(appointmentsTable).values({
              clinicId,
              patientName: action.patientName,
              patientPhone: action.patientPhone,
              doctorId: action.doctorId,
              appointmentDate: action.appointmentDate,
              timeSlot: action.timeSlot,
              status: "scheduled",
              notes: action.notes ?? null,
              tokenNumber,
            });
            bookedTokenNumber = tokenNumber;
            bookedPatientName = action.patientName ?? null;
            appointmentBooked = true;
            logger.info({ action }, "Appointment booked via AI agent");
          } else {
            logger.warn({ action }, "Slot conflict detected during booking");
          }
        }

        if (action.type === "CANCEL_APPOINTMENT") {
          const [apt] = await db
            .select()
            .from(appointmentsTable)
            .where(
              and(
                eq(appointmentsTable.id, action.appointmentId),
                eq(appointmentsTable.clinicId, clinicId),
                eq(appointmentsTable.patientPhone, patientPhone)
              )
            );

          if (apt) {
            await db
              .update(appointmentsTable)
              .set({ status: "cancelled" })
              .where(eq(appointmentsTable.id, action.appointmentId));
            appointmentCancelled = true;
            logger.info({ appointmentId: action.appointmentId }, "Appointment cancelled via AI agent");
          } else {
            logger.warn({ action }, "Could not find appointment to cancel");
          }
        }
      } catch (err) {
        logger.warn({ err }, "Failed to parse ACTION from AI reply");
      }
    }
  }

  let cleanReply = rawReply
    .split("\n")
    .filter((l) => !l.startsWith("ACTION:"))
    .join("\n")
    .trim();

  if (appointmentBooked && bookedTokenNumber !== null) {
    cleanReply += `\n\n🎫 *Your Token Number: ${bookedTokenNumber}*\nPlease show this number when you arrive at the clinic.`;
  }

  return { reply: cleanReply, appointmentBooked, patientName: bookedPatientName, appointmentCancelled };
}
