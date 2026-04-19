import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import notification from "../controllers/notification.controller.ts";
import { Router } from "express";
var router = Router()

// Send global notification
router.post("/globalNotification", [authenticate, isAdminOnly], notification.globalNotification);

// Send a notification to a specific token
router.post("/token", [authenticate, managerOrAdminOnly], notification.notificationByToken);

export default router
