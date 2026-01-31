import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";
import BusinessUnitRoutes from "./businessunit.routes.js";

const router = Router();

router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/businessunits", BusinessUnitRoutes);

export default router;
