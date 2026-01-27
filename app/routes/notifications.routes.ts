import notification from "../controllers/notification.controller.js";
import { Router } from "express";
var router = Router()

// Send global notification
router.post("/globalNotification", notification.globalNotification);

// Send a notification to a specific token
router.post("/notificationByToken", notification.notificationByToken);

export default router


///notifications/notificationByToken