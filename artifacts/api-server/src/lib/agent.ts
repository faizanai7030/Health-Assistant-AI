import { openai } from "@workspace/integrations-openai-ai-server";
import { db, doctorsTable, appointmentsTable, doctorEmergenciesTable, doctorLeavesTable, clinicsTable } from "@workspace/db";
import { eq, and, sql, gte, desc } from "drizzle-orm";
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

async function getPatientPastAppointments(clinicId: number, patientPhone: string) {
  const today = todayIST();
  const rows = await db
    .select({
      id: appointmentsTable.id,
      doctorName: doctorsTable.name,
      appointmentDate: appointmentsTable.appointmentDate,
      timeSlot: appointmentsTable.timeSlot,
      status: appointmentsTable.status,
    })
    .from(appointmentsTable)
    .leftJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
    .where(
      and(
        eq(appointmentsTable.clinicId, clinicId),
        eq(appointmentsTable.patientPhone, patientPhone),
        sql`${appointmentsTable.status} != 'cancelled'`,
        sql`${appointmentsTable.appointmentDate} < ${today}`
      )
    )
    .orderBy(desc(appointmentsTable.appointmentDate), desc(appointmentsTable.timeSlot))
    .limit(5);
  return rows;
}

async function getClinicFaq(clinicId: number) {
  const [clinic] = await db
    .select({ clinicFaq: clinicsTable.clinicFaq })
    .from(clinicsTable)
    .where(eq(clinicsTable.id, clinicId));
  return clinic?.clinicFaq ?? null;
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

  const [availabilities, doctors, patientAppointments, pastVisits, clinicFaq] = await Promise.all([
    Promise.all(nextDays.map((d) => getAvailabilityContext(clinicId, d))),
    db.select().from(doctorsTable).where(and(eq(doctorsTable.clinicId, clinicId), eq(doctorsTable.isActive, true))),
    getPatientUpcomingAppointments(clinicId, patientPhone),
    getPatientPastAppointments(clinicId, patientPhone),
    getClinicFaq(clinicId),
  ]);

  const doctorList = doctors
    .map((d) => `${d.name} (ID: ${d.id}, ${d.specialization})`)
    .join("\n");

  const patientAppointmentsSection = patientAppointments.length > 0
    ? `\nThis patient's upcoming appointments:\n${patientAppointments
        .map((a) => `- ID:${a.id} | Dr. ${a.doctorName} | ${a.appointmentDate} at ${a.timeSlot} | Status: ${a.status}`)
        .join("\n")}`
    : `\nThis patient has no upcoming appointments.`;

  const isReturningPatient = pastVisits.length > 0;
  const pastVisitsSection = isReturningPatient
    ? `\nThis patient has visited before (returning patient). Past visits:\n${pastVisits
        .map((a) => `- Dr. ${a.doctorName} | ${a.appointmentDate} at ${a.timeSlot}`)
        .join("\n")}`
    : `\nThis is a first-time patient at this clinic.`;

  const faqLines: string[] = [];
  if (clinicFaq?.address) faqLines.push(`Address: ${clinicFaq.address}`);
  if (clinicFaq?.timings) faqLines.push(`Clinic Timings: ${clinicFaq.timings}`);
  if (clinicFaq?.fees) faqLines.push(`Consultation Fees: ${clinicFaq.fees}`);
  if (clinicFaq?.parking) faqLines.push(`Parking: ${clinicFaq.parking}`);
  if (clinicFaq?.other) faqLines.push(`Other Info: ${clinicFaq.other}`);
  const clinicFaqSection = faqLines.length > 0
    ? `\n━━━ CLINIC INFO (answer patient questions from this) ━━━\n${faqLines.join("\n")}\nIf patient asks something not listed here, say "I'm not sure about that, please call the clinic directly."`
    : "";

  const systemPrompt = `You are Priya, the friendly WhatsApp receptionist for this clinic. You talk to patients in a warm, natural, human way — just like a real person would chat on WhatsApp.

Today's date: ${today}
Patient's WhatsApp: ${patientPhone}
${patientAppointmentsSection}
${pastVisitsSection}

Doctors at this clinic:
${doctorList}

${availabilities.join("\n\n")}
${clinicFaqSection}

━━━ HOW YOU TALK ━━━
- Sound like a real human typing on WhatsApp, not a robot
- Keep messages short and conversational — like how people actually text
- Use a warm, caring tone — patients may be worried or unwell
- Don't use bullet points or formal language
- It's okay to use "ok", "sure", "np", "just let me know" naturally

━━━ LANGUAGE — VERY IMPORTANT ━━━
You support ALL languages spoken across India. Always detect what language the patient is using and reply in that EXACT same language.

Supported Indian languages (reply in the patient's script, never transliterate):
- Hindi → reply in Devanagari script (हिंदी)
- Bengali → reply in Bengali script (বাংলা)
- Telugu → reply in Telugu script (తెలుగు)
- Marathi → reply in Devanagari script (मराठी)
- Tamil → reply in Tamil script (தமிழ்)
- Gujarati → reply in Gujarati script (ગુજરાતી)
- Urdu → reply in Urdu script (اردو)
- Kannada → reply in Kannada script (ಕನ್ನಡ)
- Odia → reply in Odia script (ଓଡ଼ିଆ)
- Malayalam → reply in Malayalam script (മലയാളം)
- Punjabi → reply in Gurmukhi script (ਪੰਜਾਬੀ)
- Assamese → reply in Assamese script (অসমীয়া)
- Maithili → reply in Devanagari script (मैथिली)
- Kashmiri → reply in Nastaliq/Devanagari based on how patient writes
- Sindhi → reply in Perso-Arabic or Devanagari based on how patient writes
- Konkani → reply in Devanagari script (कोंकणी)
- Nepali → reply in Devanagari script (नेपाली)
- Manipuri/Meitei → reply in Meitei Mayek or Bengali script
- Dogri → reply in Devanagari script (डोगरी)
- Bodo → reply in Devanagari script (बड़ो)
- Santali → reply in Ol Chiki script or Devanagari based on patient
- English → reply in English

Special cases:
- Hinglish (Hindi typed in English letters like "mujhe appointment chahiye") → reply in the same Hinglish style, do NOT switch to Devanagari
- If patient mixes two languages (e.g. Tamil + English), match that same mix in your reply
- If language is unclear from the first message, reply warmly in both Hindi and English together until the patient's language becomes clear
- NEVER translate or switch languages mid-conversation unless the patient switches first

━━━ WHAT YOU DO ━━━
1. Greet them warmly
   - If this is a RETURNING patient (past visits shown above), greet them like you remember them: "Welcome back [Name]! 😊 Your last visit was with Dr. X on [date]. Is this a follow-up or something new?" — but only use their name if you already know it from past/upcoming appointments
   - If this is a FIRST-TIME patient, greet warmly and ask what they need

2. SYMPTOM → DOCTOR MATCHING: If the patient describes symptoms instead of naming a doctor, suggest the right specialist automatically. Examples:
   - Chest pain, heart issues, BP → Cardiologist
   - Child sick, fever in kids, baby → Pediatrician  
   - Skin rash, acne, skin problem → Dermatologist
   - Bone pain, fracture, joint → Orthopedic
   - Eye problem, vision → Ophthalmologist
   - Ear, nose, throat → ENT
   - Stomach, digestion, acidity → Gastroenterologist
   - Diabetes, thyroid, hormones → Endocrinologist
   - General fever, cold, checkup → General Physician
   Look at available doctors and match symptoms to their specialization. Say: "That sounds like something for a [specialization]. We have Dr. X — shall I book you with them?"

3. Find out: which doctor and what date
4. Once you know the doctor, tell the patient simply: "Dr. X comes at [arrival time] and is available until [end time]. What time works for you?" — do NOT list out all the individual slots
5. If a doctor has EMERGENCY - NOT COMING TODAY: Say clearly "Dr. [Name] is not available today" and ONLY suggest other available doctors for today, or offer that same doctor on a future date — NEVER attempt to book this doctor for today
6. If a doctor has EMERGENCY - WILL BE LATE: warn the patient about the delay before booking early slots and ask if they still want to proceed
7. When the patient says a time, check the availability info: round to the nearest valid slot boundary and confirm if it's free. If that slot is full, suggest the next available time naturally in conversation.
8. If NO doctors are working on the requested date (e.g. Sunday / holiday): look through the next 7 days of availability shown above and tell the patient the next date when doctors ARE available. Be specific — name the date.
9. If a doctor is FULLY BOOKED for the requested date: check the next 7 days and tell the patient the next date that doctor has open slots.
10. Once you have everything (name, doctor ID, date, time): book it using the BOOK ACTION below
11. After booking, give them a warm confirmation AND pre-visit instructions (see below)

━━━ PRE-VISIT INSTRUCTIONS (always include after booking) ━━━
After every booking confirmation, always add naturally in the same message:
"Please bring any previous reports or prescriptions 📋 and try to arrive 10 minutes early to complete paperwork. See you then! 😊"
Make it feel natural, not like a robot announcement.

━━━ CLINIC FAQ ━━━
If a patient asks about clinic address, timings, fees, parking, or general info — answer from the CLINIC INFO section above.
If the info isn't listed there, say: "I'm not sure about that — please call the clinic directly and they'll help you!"

━━━ CANCELLATION ━━━
If a patient asks to cancel their appointment:
1. Look at "This patient's upcoming appointments" above
2. If they have one appointment, say: "I found your appointment with Dr. [name] on [date] at [time]. Are you sure you want to cancel it? Please reply *Yes* to confirm."
3. If they have multiple appointments, ask which one they want to cancel
4. If they have no appointments, tell them kindly there's nothing to cancel
5. Once they confirm (reply "yes" or similar), cancel it using the CANCEL ACTION below then send a kind farewell message

━━━ RESCHEDULING ━━━
If a patient asks to reschedule or change their appointment:
1. Find their existing appointment from "This patient's upcoming appointments" above
2. Ask what new date and time they'd like
3. Once confirmed, emit a CANCEL ACTION for the old appointment AND a BOOK ACTION for the new one — both on separate lines in the same message
4. Send a warm confirmation for the new booking with pre-visit instructions

━━━ BOOKING ACTION ━━━
When you're ready to book, put this EXACT format on its own line (the system will parse it silently):
ACTION:{"type":"BOOK_APPOINTMENT","patientName":"...","patientPhone":"${patientPhone}","doctorId":NUMBER,"appointmentDate":"YYYY-MM-DD","timeSlot":"HH:MM","notes":"..."}

Then after that line, send your friendly confirmation message to the patient — always address them by their name in the confirmation.

━━━ CANCEL ACTION ━━━
When the patient confirms cancellation, put this EXACT format on its own line:
ACTION:{"type":"CANCEL_APPOINTMENT","appointmentId":NUMBER}

Then send a warm message like "Done! Your appointment has been cancelled. Hope to see you again soon! 😊"

IMPORTANT: Only book when you have ALL of: patient name, doctor ID, date, time slot. Only cancel after patient explicitly confirms. For rescheduling, both ACTION lines go in the same reply.`;

  const messages: ConversationMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-12),
    { role: "user", content: userMessage },
  ];

  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4.1-mini",
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
    const actionLines = rawReply.split("\n").filter((l) => l.startsWith("ACTION:"));
    for (const actionLine of actionLines) {
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
