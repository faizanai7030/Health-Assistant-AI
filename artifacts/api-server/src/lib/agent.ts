import { openai } from "@workspace/integrations-openai-ai-server";
import { db, doctorsTable, appointmentsTable } from "@workspace/db";
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

export async function getAvailabilityContext(date: string): Promise<string> {
  const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.isActive, true));
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();

  const lines: string[] = [`Availability for ${date}:`];

  for (const doc of doctors) {
    const workingDays = doc.workingDays.split(",").map(Number);
    if (!workingDays.includes(dayOfWeek)) {
      lines.push(`- Dr. ${doc.name} (${doc.specialization}): Not working on this day`);
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
      lines.push(`- Dr. ${doc.name} (${doc.specialization}): Fully booked`);
    } else {
      lines.push(`- Dr. ${doc.name} (${doc.specialization}): Available slots: ${available.join(", ")}`);
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

  const availabilityToday = await getAvailabilityContext(today);
  const availabilityTomorrow = await getAvailabilityContext(tomorrow);
  const availabilityDayAfter = await getAvailabilityContext(dayAfter);

  const doctors = await db.select().from(doctorsTable).where(eq(doctorsTable.isActive, true));
  const doctorList = doctors.map((d) => `Dr. ${d.name} (${d.specialization})`).join(", ");

  const systemPrompt = `You are a friendly and professional medical appointment assistant for a clinic. You help patients book appointments via WhatsApp.

Today's date: ${today}
Patient phone: ${patientPhone}

Available doctors: ${doctorList}

${availabilityToday}

${availabilityTomorrow}

${availabilityDayAfter}

Your responsibilities:
1. Greet patients warmly and help them book appointments
2. Ask for: patient name (if not known), preferred doctor or specialization, preferred date and time slot
3. Check availability before confirming
4. When booking, respond with a JSON action in this EXACT format on its own line:
   ACTION:{"type":"BOOK_APPOINTMENT","patientName":"...","patientPhone":"${patientPhone}","doctorId":NUMBER,"appointmentDate":"YYYY-MM-DD","timeSlot":"HH:MM","notes":"..."}
5. After the ACTION line, confirm the appointment in a friendly message
6. If a slot is full, suggest alternatives
7. Keep responses concise and friendly
8. Only book if you have: patient name, doctor (ID), date, and time slot

IMPORTANT: When you decide to book an appointment, include the ACTION JSON line first, then your friendly message. The system will parse it.`;

  const messages: ConversationMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10),
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-5.4",
    max_completion_tokens: 512,
    messages,
  });

  const rawReply = response.choices[0]?.message?.content ?? "I'm sorry, I couldn't process your request. Please try again.";

  let appointmentBooked = false;

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
            await db.insert(appointmentsTable).values({
              patientName: action.patientName,
              patientPhone: action.patientPhone,
              doctorId: action.doctorId,
              appointmentDate: action.appointmentDate,
              timeSlot: action.timeSlot,
              status: "scheduled",
              notes: action.notes ?? null,
            });
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

  const cleanReply = rawReply
    .split("\n")
    .filter((l) => !l.startsWith("ACTION:"))
    .join("\n")
    .trim();

  return { reply: cleanReply, appointmentBooked };
}
