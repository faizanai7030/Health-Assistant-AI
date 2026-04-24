import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, whatsappConversationsTable, whatsappMessagesTable } from "@workspace/db";
import {
  GetConversationParams,
  HandleWhatsappWebhookBody,
  SimulateWhatsappMessageBody,
} from "@workspace/api-zod";
import { processWhatsAppMessage } from "../lib/agent";

const router: IRouter = Router();

async function getOrCreateConversation(clinicId: number, patientPhone: string, patientName?: string) {
  const existing = await db
    .select()
    .from(whatsappConversationsTable)
    .where(and(eq(whatsappConversationsTable.clinicId, clinicId), eq(whatsappConversationsTable.patientPhone, patientPhone)));

  if (existing[0]) {
    if (patientName && !existing[0].patientName) {
      const [updated] = await db
        .update(whatsappConversationsTable)
        .set({ patientName })
        .where(eq(whatsappConversationsTable.id, existing[0].id))
        .returning();
      return updated;
    }
    return existing[0];
  }

  const [conv] = await db
    .insert(whatsappConversationsTable)
    .values({ clinicId, patientPhone, patientName: patientName ?? null })
    .returning();
  return conv;
}

router.get("/conversations", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const conversations = await db
    .select({
      id: whatsappConversationsTable.id,
      patientPhone: whatsappConversationsTable.patientPhone,
      patientName: whatsappConversationsTable.patientName,
      status: whatsappConversationsTable.status,
      createdAt: whatsappConversationsTable.createdAt,
      messageCount: sql<number>`count(${whatsappMessagesTable.id})::int`,
      lastMessage: sql<string | null>`max(${whatsappMessagesTable.content})`,
      lastMessageAt: sql<string | null>`max(${whatsappMessagesTable.createdAt})`,
    })
    .from(whatsappConversationsTable)
    .leftJoin(whatsappMessagesTable, eq(whatsappMessagesTable.conversationId, whatsappConversationsTable.id))
    .where(eq(whatsappConversationsTable.clinicId, clinicId))
    .groupBy(whatsappConversationsTable.id)
    .orderBy(desc(whatsappConversationsTable.updatedAt));

  res.json(
    conversations.map((c) => ({
      ...c,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      lastMessageAt: c.lastMessageAt instanceof Date ? (c.lastMessageAt as unknown as Date).toISOString() : c.lastMessageAt,
    }))
  );
});

router.get("/conversations/:id", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [conv] = await db
    .select()
    .from(whatsappConversationsTable)
    .where(eq(whatsappConversationsTable.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(whatsappMessagesTable)
    .where(eq(whatsappMessagesTable.conversationId, conv.id))
    .orderBy(whatsappMessagesTable.createdAt);

  res.json({
    id: conv.id,
    patientPhone: conv.patientPhone,
    patientName: conv.patientName,
    status: conv.status,
    createdAt: conv.createdAt.toISOString(),
    messages: messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

router.post("/conversations/webhook", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const parsed = HandleWhatsappWebhookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { from: patientPhone, message } = parsed.data;
  const conv = await getOrCreateConversation(clinicId, patientPhone);

  const history = await db
    .select()
    .from(whatsappMessagesTable)
    .where(eq(whatsappMessagesTable.conversationId, conv.id))
    .orderBy(whatsappMessagesTable.createdAt);

  await db.insert(whatsappMessagesTable).values({
    conversationId: conv.id,
    role: "user",
    content: message,
  });

  const { reply, appointmentBooked, patientName } = await processWhatsAppMessage(
    clinicId,
    patientPhone,
    message,
    history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
  );

  await db.insert(whatsappMessagesTable).values({
    conversationId: conv.id,
    role: "assistant",
    content: reply,
  });

  await db
    .update(whatsappConversationsTable)
    .set({
      updatedAt: new Date(),
      ...(patientName && !conv.patientName ? { patientName } : {}),
    })
    .where(eq(whatsappConversationsTable.id, conv.id));

  req.log.info({ patientPhone, appointmentBooked }, "Processed WhatsApp message");

  res.json({ response: reply, conversationId: conv.id });
});

router.post("/conversations/simulate", async (req, res): Promise<void> => {
  const clinicId = req.clinicId!;
  const parsed = SimulateWhatsappMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { patientPhone, message } = parsed.data;
  const conv = await getOrCreateConversation(clinicId, patientPhone);

  const history = await db
    .select()
    .from(whatsappMessagesTable)
    .where(eq(whatsappMessagesTable.conversationId, conv.id))
    .orderBy(whatsappMessagesTable.createdAt);

  await db.insert(whatsappMessagesTable).values({
    conversationId: conv.id,
    role: "user",
    content: message,
  });

  const { reply, appointmentBooked, patientName } = await processWhatsAppMessage(
    clinicId,
    patientPhone,
    message,
    history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
  );

  await db.insert(whatsappMessagesTable).values({
    conversationId: conv.id,
    role: "assistant",
    content: reply,
  });

  await db
    .update(whatsappConversationsTable)
    .set({
      updatedAt: new Date(),
      ...(patientName && !conv.patientName ? { patientName } : {}),
    })
    .where(eq(whatsappConversationsTable.id, conv.id));

  res.json({ response: reply, conversationId: conv.id, appointmentBooked });
});

export default router;
