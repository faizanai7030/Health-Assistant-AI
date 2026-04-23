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

export default router;
