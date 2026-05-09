import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, clinicsTable, whatsappConversationsTable, whatsappMessagesTable } from "@workspace/db";
import { processWhatsAppMessage } from "../lib/agent";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.post("/conversations/webhook", async (req, res): Promise<void> => {
  const { from: patientPhone, to: clinicPhone, message } = req.body as {
    from?: string;
    to?: string;
    message?: string;
  };

  if (!patientPhone || !clinicPhone || !message) {
    res.status(400).json({ error: "from, to, and message are required" });
    return;
  }

  const [clinic] = await db
    .select({ id: clinicsTable.id, isActive: clinicsTable.isActive })
    .from(clinicsTable)
    .where(eq(clinicsTable.whatsappNumber, clinicPhone));

  if (!clinic || !clinic.isActive) {
    res.status(404).json({ error: "No active clinic found for this WhatsApp number" });
    return;
  }

  const clinicId = clinic.id;

  res.json({ status: "received" });

  setImmediate(async () => {
    try {
      const existing = await db
        .select()
        .from(whatsappConversationsTable)
        .where(and(
          eq(whatsappConversationsTable.clinicId, clinicId),
          eq(whatsappConversationsTable.patientPhone, patientPhone)
        ));

      let conv = existing[0];
      if (!conv) {
        const [created] = await db
          .insert(whatsappConversationsTable)
          .values({ clinicId, patientPhone, patientName: null })
          .returning();
        conv = created;
      }

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

      logger.info({ patientPhone, clinicPhone, clinicId, appointmentBooked }, "Processed WhatsApp webhook message");
    } catch (err) {
      logger.error({ err, patientPhone, clinicPhone }, "Failed to process WhatsApp webhook message");
    }
  });
});

export default router;
