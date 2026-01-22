import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";

const router = Router();

router.use("/", AuthRoutes);
router.use("/users", UserRoutes);

export default router;
