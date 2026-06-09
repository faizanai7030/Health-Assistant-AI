import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import healthRouter from "./health";
import authRouter from "./auth";
import superAdminRouter from "./super-admin";
import doctorsRouter from "./doctors";
import appointmentsRouter from "./appointments";
import conversationsRouter from "./conversations";
import dashboardRouter from "./dashboard";
import emergencyRouter from "./emergency";
import portalRouter from "./portal";
import remindersRouter from "./reminders";
import webhookRouter from "./webhook";
import visitStatusRouter from "./visit-status";
import metaWebhookRouter from "./meta-webhook";

const router: IRouter = Router();

// Public routes
router.use(healthRouter);
router.use(authRouter);
router.use(portalRouter);
router.use(superAdminRouter);
router.use(webhookRouter);
router.use(metaWebhookRouter);

// Protected routes — require clinic login
router.use(requireAuth);
router.use(emergencyRouter);
router.use(remindersRouter);
router.use(doctorsRouter);
router.use(appointmentsRouter);
router.use(conversationsRouter);
router.use(dashboardRouter);
router.use(visitStatusRouter);

export default router;
