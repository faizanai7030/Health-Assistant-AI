import { openai } from "@workspace/integrations-openai-ai-server";
import { db, doctorsTable, appointmentsTable, doctorEmergenciesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { logger } from "./logger";

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

async function getTodayEmergencies(): Promise<Map<number, { type: string; message: string | null }>> {
  const today = new Date().toISOString().split("T")[0];
  const rows = await db
    .select()
    .from(doctorEmergenciesTable)
    .where(eq(doctorEmergenciesTable.date, today));

  const map = new Map<number, { type: string; message: string | null }>();
  for (const row of rows) {
    map.set(row.doctorId, { type: row.type, message: row.message ?? null });
  }
  return map;
}

export async function getAvailabilityContext(date: string): Promise<string> {
  const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.isActive, true));
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  const today = new Date().toISOString().split("T")[0];
  const emergencies = date === today ? await getTodayEmergencies() : new Map();

  const lines: string[] = [`Availability for ${date}:`];

  for (const doc of doctors) {
    const emergency = emergencies.get(doc.id);

    if (emergency) {
      if (emergency.type === "absent") {
        lines.push(`- ${doc.name} (${doc.specialization}): EMERGENCY - Doctor is NOT coming today. Do not book.`);
        continue;
      }
      if (emergency.type === "late") {
        lines.push(`- ${doc.name} (${doc.specialization}): EMERGENCY - Doctor will be late today. Use caution when booking early slots.`);
      }
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

    if (available.length === 0) {
      lines.push(`- ${doc.name} (${doc.specialization}): Fully booked`);
    } else {
      lines.push(`- ${doc.name} (${doc.specialization}): Available slots: ${available.join(", ")}`);
    }
  }

  return lines.join("\n");
}

interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function processWhatsAppMessage(
  patientPhone: string,
  userMessage: string,
  conversationHistory: ConversationMessage[]
): Promise<{ reply: string; appointmentBooked: boolean }> {
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0];

  const [availabilityToday, availabilityTomorrow, availabilityDayAfter, doctors] = await Promise.all([
    getAvailabilityContext(today),
    getAvailabilityContext(tomorrow),
    getAvailabilityContext(dayAfter),
    db.select().from(doctorsTable).where(eq(doctorsTable.isActive, true)),
  ]);

  const doctorList = doctors
    .map((d) => `${d.name} (ID: ${d.id}, ${d.specialization})`)
    .join("\n");

  const systemPrompt = `You are Priya, the friendly WhatsApp receptionist for this clinic. You talk to patients in a warm, natural, human way — just like a real person would chat on WhatsApp.

Today's date: ${today}
Patient's WhatsApp: ${patientPhone}

Doctors at this clinic:
${doctorList}

${availabilityToday}

${availabilityTomorrow}

${availabilityDayAfter}

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
2. Find out: which doctor (or what kind of doctor), what date, what time
3. Check the availability info above
4. If a doctor has EMERGENCY - NOT COMING TODAY: apologize and suggest another doctor or another day
5. If a doctor has EMERGENCY - WILL BE LATE: mention this to the patient before booking early slots
6. If a slot is full: suggest the next available one — don't just say "sorry, it's full"
7. Once you have everything (name, doctor ID, date, time): book it using the ACTION below
8. After booking, give them a warm confirmation with all the details

━━━ BOOKING ━━━
When you're ready to book, put this EXACT format on its own line (the system will parse it silently):
ACTION:{"type":"BOOK_APPOINTMENT","patientName":"...","patientPhone":"${patientPhone}","doctorId":NUMBER,"appointmentDate":"YYYY-MM-DD","timeSlot":"HH:MM","notes":"..."}

Then after that line, send your friendly confirmation message to the patient — always address them by their name in the confirmation.

IMPORTANT: Only book when you have ALL of: patient name, doctor ID, date, time slot.`;

  const messages: ConversationMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-12),
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    max_completion_tokens: 600,
    messages,
  });

  const rawReply = response.choices[0]?.message?.content ?? "Sorry, I couldn't process that. Could you try again? 🙏";

  let appointmentBooked = false;
  let bookedTokenNumber: number | null = null;

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
                  eq(appointmentsTable.doctorId, action.doctorId),
                  eq(appointmentsTable.appointmentDate, action.appointmentDate),
                  sql`${appointmentsTable.status} != 'cancelled'`
                )
              );
            const tokenNumber = (tokenCountResult[0]?.count ?? 0) + 1;

            await db.insert(appointmentsTable).values({
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
            appointmentBooked = true;
            logger.info({ action }, "Appointment booked via AI agent");
          } else {
            logger.warn({ action }, "Slot conflict detected during booking");
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

  return { reply: cleanReply, appointmentBooked };
}
