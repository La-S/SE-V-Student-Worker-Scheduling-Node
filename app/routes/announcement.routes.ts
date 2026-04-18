import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import announcements from "../controllers/announcement.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import AnnouncementModel from "../models/announcement.model.ts"
import { Router } from "express";
var router = Router()


// Create a new Announcement
router.post("/", [authenticate, managerOrAdminOnly], announcements.create);

router.post("/specific", [authenticate, managerOrAdminOnly], announcements.createSpecificEmployees);
router.post("/:id/email", [authenticate, managerOrAdminOnly], announcements.sendEmail);

// Retrieve all Announcements
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(AnnouncementModel));

// Retrieve a single Announcement by id
router.get("/:id", [authenticate], announcements.findOne);

// Update a Announcement by id
router.put("/:id", [authenticate, managerOrAdminOnly], announcements.update);

// Delete a Announcement by id
router.delete("/:id", [authenticate, managerOrAdminOnly], generalcontroller.delete(AnnouncementModel));

export default router;
