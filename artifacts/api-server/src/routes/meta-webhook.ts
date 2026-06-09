import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, clinicsTable, whatsappConversationsTable, whatsappMessagesTable } from "@workspace/db";
import { processWhatsAppMessage } from "../lib/agent";
import { sendMetaWhatsAppMessage } from "../lib/meta-whatsapp";
import { logger } from "../lib/logger";

const router = Router();

// GET /meta/webhook — Meta webhook verification handshake
router.get("/meta/webhook", (req, res): void => {
  const verifyToken = process.env["META_WEBHOOK_VERIFY_TOKEN"];
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken) {
    logger.info("Meta webhook verified successfully");
    res.status(200).send(challenge);
    return;
  }

  logger.warn({ mode, token }, "Meta webhook verification failed");
  res.sendStatus(403);
});

// POST /meta/webhook — Receive real WhatsApp messages from Meta Cloud API
router.post("/meta/webhook", async (req, res): Promise<void> => {
  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  try {
    const body = req.body as MetaWebhookPayload;

    if (body.object !== "whatsapp_business_account") return;

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "messages") continue;

        const value = change.value;
        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        // Find the clinic by their Meta phone number ID
        const [clinic] = await db
          .select({
            id: clinicsTable.id,
            isActive: clinicsTable.isActive,
            metaAccessToken: clinicsTable.metaAccessToken,
            metaPhoneNumberId: clinicsTable.metaPhoneNumberId,
          })
          .from(clinicsTable)
          .where(and(eq(clinicsTable.metaPhoneNumberId, phoneNumberId), eq(clinicsTable.isActive, true)));

        if (!clinic || !clinic.metaAccessToken) {
          logger.warn({ phoneNumberId }, "No active clinic found for this Meta phone number ID");
          continue;
        }

        for (const msg of value.messages ?? []) {
          if (msg.type !== "text") {
            logger.info({ type: msg.type, from: msg.from }, "Ignoring non-text Meta message");
            continue;
          }

          const patientPhone = msg.from;
          const messageText = msg.text?.body ?? "";
          const patientName = value.contacts?.find(c => c.wa_id === patientPhone)?.profile?.name ?? null;

          if (!messageText.trim()) continue;

          const clinicId = clinic.id;

          // Get or create conversation
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
              .values({ clinicId, patientPhone, patientName })
              .returning();
            conv = created;
          } else if (patientName && !conv.patientName) {
            await db.update(whatsappConversationsTable)
              .set({ patientName })
              .where(eq(whatsappConversationsTable.id, conv.id));
          }

          // Load history
          const history = await db
            .select()
            .from(whatsappMessagesTable)
            .where(eq(whatsappMessagesTable.conversationId, conv.id))
            .orderBy(whatsappMessagesTable.createdAt);

          // Save incoming message
          await db.insert(whatsappMessagesTable).values({
            conversationId: conv.id,
            role: "user",
            content: messageText,
          });

          // Run through Priya
          const { reply, appointmentBooked, patientName: extractedName } = await processWhatsAppMessage(
            clinicId,
            patientPhone,
            messageText,
            history.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
          );

          // Save Priya's reply
          await db.insert(whatsappMessagesTable).values({
            conversationId: conv.id,
            role: "assistant",
            content: reply,
          });

          await db.update(whatsappConversationsTable)
            .set({
              updatedAt: new Date(),
              ...((extractedName || patientName) && !conv.patientName
                ? { patientName: extractedName ?? patientName }
                : {}),
            })
            .where(eq(whatsappConversationsTable.id, conv.id));

          // SEND THE REPLY back to the patient via Meta Cloud API
          await sendMetaWhatsAppMessage(
            clinic.metaPhoneNumberId!,
            clinic.metaAccessToken,
            patientPhone,
            reply
          );

          logger.info({ patientPhone, clinicId, appointmentBooked }, "Processed and replied to Meta WhatsApp message");
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Error processing Meta webhook payload");
  }
});

export default router;

// Types for Meta webhook payload
interface MetaWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      field: string;
      value: MetaWebhookValue;
    }>;
  }>;
}

interface MetaWebhookValue {
  messaging_product: string;
  metadata?: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name: string };
    wa_id: string;
  }>;
  messages?: Array<{
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
  }>;
}
