import { Router, type IRouter } from "express";
import healthRouter from "./health";
import doctorsRouter from "./doctors";
import appointmentsRouter from "./appointments";
import conversationsRouter from "./conversations";
import dashboardRouter from "./dashboard";
import emergencyRouter from "./emergency";
import portalRouter from "./portal";
import remindersRouter from "./reminders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(portalRouter);
router.use(emergencyRouter);
router.use(remindersRouter);
router.use(doctorsRouter);
router.use(appointmentsRouter);
router.use(conversationsRouter);
router.use(dashboardRouter);

export default router;
