import { Router } from "express";
import bcrypt from "bcrypt";
import { db, clinicsTable, doctorsTable, appointmentsTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import { requireSuperAdmin } from "../lib/auth";

const router = Router();

router.post("/super-admin/login", (req, res): void => {
  const { password } = req.body as { password: string };
  const superAdminKey = process.env["SUPER_ADMIN_KEY"];

  if (!superAdminKey) {
    res.status(500).json({ error: "Super admin not configured" });
    return;
  }

  if (!password || password !== superAdminKey) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  req.session.isSuperAdmin = true;
  res.json({ ok: true });
});

router.post("/super-admin/logout", (req, res): void => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get("/super-admin/me", (req, res): void => {
  if (!req.session?.isSuperAdmin) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ isSuperAdmin: true });
});

router.get("/super-admin/clinics", requireSuperAdmin, async (req, res): Promise<void> => {
  const clinics = await db.select().from(clinicsTable).orderBy(desc(clinicsTable.createdAt));

  const withStats = await Promise.all(
    clinics.map(async (clinic) => {
      const [doctorCount] = await db
        .select({ count: count() })
        .from(doctorsTable)
        .where(eq(doctorsTable.clinicId, clinic.id));
      const [appointmentCount] = await db
        .select({ count: count() })
        .from(appointmentsTable)
        .where(eq(appointmentsTable.clinicId, clinic.id));
      return {
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        adminEmail: clinic.adminEmail,
        whatsappNumber: clinic.whatsappNumber,
        isActive: clinic.isActive,
        createdAt: clinic.createdAt instanceof Date ? clinic.createdAt.toISOString() : clinic.createdAt,
        doctorCount: doctorCount?.count ?? 0,
        appointmentCount: appointmentCount?.count ?? 0,
      };
    })
  );

  res.json(withStats);
});

router.post("/super-admin/clinics", requireSuperAdmin, async (req, res): Promise<void> => {
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

  const existing = await db.select().from(clinicsTable).where(eq(clinicsTable.slug, slug));
  if (existing.length > 0) {
    res.status(409).json({ error: "A clinic with this slug already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [clinic] = await db
    .insert(clinicsTable)
    .values({ name, slug, adminEmail, passwordHash, whatsappNumber: whatsappNumber ?? null, isActive: true })
    .returning();

  res.status(201).json({
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    adminEmail: clinic.adminEmail,
    whatsappNumber: clinic.whatsappNumber,
    isActive: clinic.isActive,
    createdAt: clinic.createdAt instanceof Date ? clinic.createdAt.toISOString() : clinic.createdAt,
    doctorCount: 0,
    appointmentCount: 0,
  });
});

router.patch("/super-admin/clinics/:id", requireSuperAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { name, adminEmail, password, whatsappNumber, isActive } = req.body as {
    name?: string;
    adminEmail?: string;
    password?: string;
    whatsappNumber?: string;
    isActive?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (adminEmail !== undefined) updates.adminEmail = adminEmail;
  if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber;
  if (isActive !== undefined) updates.isActive = isActive;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  const [updated] = await db.update(clinicsTable).set(updates).where(eq(clinicsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Clinic not found" });
    return;
  }

  res.json({ ok: true });
});

export default router;
