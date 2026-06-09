import { logger } from "./logger";

const META_API_VERSION = "v19.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export async function sendMetaWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
): Promise<void> {
  const url = `${META_API_BASE}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: message },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    logger.error({ status: res.status, errText, to, phoneNumberId }, "Meta WhatsApp send failed");
    throw new Error(`Meta API error ${res.status}: ${errText}`);
  }

  const data = await res.json() as { messages?: { id: string }[] };
  logger.info({ to, messageId: data.messages?.[0]?.id }, "Meta WhatsApp message sent");
}
