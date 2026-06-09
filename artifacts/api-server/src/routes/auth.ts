import { Router } from "express";
import bcrypt from "bcrypt";
import { db, clinicsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [clinic] = await db.select().from(clinicsTable).where(eq(clinicsTable.adminEmail, email));

  if (!clinic || !clinic.isActive) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, clinic.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.clinicId = clinic.id;
  req.session.clinicName = clinic.name;
  req.session.adminEmail = clinic.adminEmail;

  res.json({
    clinicId: clinic.id,
    clinicName: clinic.name,
    adminEmail: clinic.adminEmail,
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  res.json({
    clinicId: req.session.clinicId,
    clinicName: req.session.clinicName,
    adminEmail: req.session.adminEmail,
  });
});

// Super-admin: create a new clinic (protected by SUPER_ADMIN_KEY env var)
router.post("/auth/create-clinic", async (req, res): Promise<void> => {
  const adminKey = req.headers["x-admin-key"];
  if (!adminKey || adminKey !== process.env["SUPER_ADMIN_KEY"]) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { name, slug, adminEmail, password, whatsappNumber } = req.body as {
    name: string;
    slug: string;
    adminEmail: string;
    password: string;
    whatsappNumber?: string;
  };

  if (!name || !slug || !adminEmail || !password) {
    res.status(400).json({ error: "name, slug, adminEmail, password are required" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [clinic] = await db.insert(clinicsTable).values({
    name,
    slug,
    adminEmail,
    passwordHash,
    whatsappNumber: whatsappNumber ?? null,
    isActive: true,
  }).returning();

  res.status(201).json({
    clinicId: clinic.id,
    clinicName: clinic.name,
    slug: clinic.slug,
    adminEmail: clinic.adminEmail,
  });
});

router.get("/settings/whatsapp", requireAuth, async (req, res): Promise<void> => {
  const [clinic] = await db
    .select({ whatsappNumber: clinicsTable.whatsappNumber })
    .from(clinicsTable)
    .where(eq(clinicsTable.id, req.clinicId!));

  const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "health-assistant-ai.replit.app";
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const webhookUrl = `${protocol}://${host}/api/conversations/webhook`;

  res.json({
    whatsappNumber: clinic?.whatsappNumber ?? null,
    webhookUrl,
  });
});

router.get("/settings/clinic-info", requireAuth, async (req, res): Promise<void> => {
  const [clinic] = await db
    .select({ clinicFaq: clinicsTable.clinicFaq })
    .from(clinicsTable)
    .where(eq(clinicsTable.id, req.clinicId!));
  res.json({ clinicFaq: clinic?.clinicFaq ?? null });
});

router.patch("/settings/clinic-info", requireAuth, async (req, res): Promise<void> => {
  const { address, timings, fees, parking, other } = req.body as {
    address?: string; timings?: string; fees?: string; parking?: string; other?: string;
  };
  const clinicFaq = { address: address ?? "", timings: timings ?? "", fees: fees ?? "", parking: parking ?? "", other: other ?? "" };
  await db.update(clinicsTable).set({ clinicFaq }).where(eq(clinicsTable.id, req.clinicId!));
  res.json({ ok: true, clinicFaq });
});

router.patch("/settings/whatsapp", requireAuth, async (req, res): Promise<void> => {
  const { whatsappNumber } = req.body as { whatsappNumber?: string };

  if (!whatsappNumber || whatsappNumber.trim() === "") {
    await db.update(clinicsTable).set({ whatsappNumber: null }).where(eq(clinicsTable.id, req.clinicId!));
    res.json({ ok: true, whatsappNumber: null });
    return;
  }

  const cleaned = whatsappNumber.trim();

  const [conflict] = await db
    .select({ id: clinicsTable.id })
    .from(clinicsTable)
    .where(eq(clinicsTable.whatsappNumber, cleaned));

  if (conflict && conflict.id !== req.clinicId!) {
    res.status(409).json({ error: "This WhatsApp number is already linked to another clinic" });
    return;
  }

  await db.update(clinicsTable).set({ whatsappNumber: cleaned }).where(eq(clinicsTable.id, req.clinicId!));
  res.json({ ok: true, whatsappNumber: cleaned });
});

router.patch("/auth/account", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword, newEmail } = req.body as {
    currentPassword: string;
    newPassword?: string;
    newEmail?: string;
  };

  if (!currentPassword) {
    res.status(400).json({ error: "Current password is required to make changes" });
    return;
  }

  const [clinic] = await db.select().from(clinicsTable).where(eq(clinicsTable.id, req.clinicId!));
  if (!clinic) {
    res.status(404).json({ error: "Clinic not found" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, clinic.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const updates: Partial<typeof clinic> = {};

  if (newEmail && newEmail !== clinic.adminEmail) {
    const [existing] = await db.select().from(clinicsTable).where(eq(clinicsTable.adminEmail, newEmail));
    if (existing) {
      res.status(409).json({ error: "That email is already in use" });
      return;
    }
    updates.adminEmail = newEmail;
  }

  if (newPassword) {
    if (newPassword.length < 8) {
      res.status(400).json({ error: "New password must be at least 8 characters" });
      return;
    }
    updates.passwordHash = await bcrypt.hash(newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No changes provided" });
    return;
  }

  await db.update(clinicsTable).set(updates).where(eq(clinicsTable.id, req.clinicId!));

  if (updates.adminEmail) {
    req.session.adminEmail = updates.adminEmail;
  }

  res.json({ ok: true, adminEmail: updates.adminEmail ?? clinic.adminEmail });
});

export default router;
