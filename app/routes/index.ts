import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";
import BusinessUnitRoutes from "./businessunit.routes.js";
import Notifications from "./notifications.routes.js";

const router = Router();

router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/businessunits", BusinessUnitRoutes);
router.use("/notifications", Notifications)

export default router;
