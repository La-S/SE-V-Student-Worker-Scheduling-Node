import { Router } from "express";

import AuthRoutes from "./auth.routes.ts";
import UserRoutes from "./user.routes.ts";
import BusinessUnitRoutes from "./businessunit.routes.ts";
import Notifications from "./notifications.routes.ts";
import EmployeeRoutes from "./employee.routes.ts"
import ShiftRoutes from "./shift.routes.ts"
import PositionRoutes from "./position.routes.ts"
import DailyScheduleTemplateRoutes from "./dailyscheduletemplate.routes.ts"
import WeeklyScheduleTemplateRoutes from "./weeklyscheduletemplate.routes.ts";
import TaskListRoutes from "./tasklist.routes.ts"
import TaskRoutes from "./task.routes.ts"
import TaskCompletionRoutes from "./taskcompletion.routes.ts"
import AvailabilityTemplateRoutes from "./availabilitytemplate.routes.ts"
import OpenHoursRoutes from "./openhours.routes.ts";
import DebugRoutes from "./debug.routes.ts";

const router = Router();

router.use("/", AuthRoutes);
router.use("/user", UserRoutes);
router.use("/businessunit", BusinessUnitRoutes);
router.use("/notification", Notifications);
router.use("/employee", EmployeeRoutes);
router.use("/position", PositionRoutes);
router.use("/shift", ShiftRoutes);
router.use("/dailyscheduletemplate", DailyScheduleTemplateRoutes)
router.use("/weeklyscheduletemplate", WeeklyScheduleTemplateRoutes)
router.use("/tasklist", TaskListRoutes);
router.use("/task", TaskRoutes)
router.use("/taskcompletion", TaskCompletionRoutes)
router.use("/availabilitytemplate", AvailabilityTemplateRoutes);
router.use("/openhours", OpenHoursRoutes);
router.use("/debug", DebugRoutes);

export default router;
