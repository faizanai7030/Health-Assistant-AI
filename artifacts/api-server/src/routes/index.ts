import { Router, type IRouter } from "express";
import healthRouter from "./health";
import doctorsRouter from "./doctors";
import appointmentsRouter from "./appointments";
import conversationsRouter from "./conversations";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(doctorsRouter);
router.use(appointmentsRouter);
router.use(conversationsRouter);
router.use(dashboardRouter);

export default router;
