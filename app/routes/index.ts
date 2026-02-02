import { Router } from "express";

import AuthRoutes from "./auth.routes.ts";
import UserRoutes from "./user.routes.ts";
import BusinessUnitRoutes from "./businessunit.routes.ts";
import Notifications from "./notifications.routes.ts";

const router = Router();

router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/businessunits", BusinessUnitRoutes);
router.use("/notifications", Notifications)

export default router;
