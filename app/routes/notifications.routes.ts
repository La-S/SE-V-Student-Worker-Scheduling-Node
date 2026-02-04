import notification from "../controllers/notification.controller.ts";
import { Router } from "express";
var router = Router()

// Send global notification
router.post("/globalNotification", notification.globalNotification);

// Send a notification to a specific token
router.post("/token", notification.notificationByToken);

export default router
