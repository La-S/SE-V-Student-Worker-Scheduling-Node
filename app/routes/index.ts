import { Router } from "express";

import AuthRoutes from "./auth.routes.ts";
import UserRoutes from "./user.routes.ts";
import BusinessUnitRoutes from "./businessunit.routes.ts";
import Notifications from "./notifications.routes.ts";

const router = Router();

router.use("/", AuthRoutes);
router.use("/user", UserRoutes);
router.use("/businessunit", BusinessUnitRoutes);
router.use("/notification", Notifications)

export default router;
