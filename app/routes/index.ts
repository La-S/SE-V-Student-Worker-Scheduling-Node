import { Router } from "express";

import AuthRoutes from "./auth.routes.ts";
import UserRoutes from "./user.routes.ts";
import BusinessUnitRoutes from "./businessunit.routes.ts";
import Notifications from "./notifications.routes.ts";
import EmployeeRoutes from "./employee.routes.ts";
import ShiftRoutes from "./shift.routes.ts";
import PositionRoutes from "./position.routes.ts";
import DebugRoutes from "./debug.routes.ts";

const router = Router();

router.use("/", AuthRoutes);
router.use("/user", UserRoutes);
router.use("/businessunit", BusinessUnitRoutes);
router.use("/notification", Notifications);
router.use("/employee", EmployeeRoutes);
router.use("/position", PositionRoutes);
router.use("/shift", ShiftRoutes);
router.use("/debug", DebugRoutes);

export default router;
