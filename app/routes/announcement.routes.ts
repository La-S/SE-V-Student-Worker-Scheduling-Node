import auth from "../authorization/authorization.ts";
import announcements from "../controllers/announcement.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import AnnouncementModel from "../models/announcement.model.ts"
import { Router } from "express";
var router = Router()


// Create a new Announcement
router.post("/", [auth.authenticate], announcements.create);

router.post("/specific", [auth.authenticate], announcements.createSpecificEmployees);
router.post("/:id/email", [auth.authenticate], announcements.sendEmail);

// Retrieve all Announcements
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(AnnouncementModel));

// Retrieve a single Announcement by id
router.get("/:id", [auth.authenticate], announcements.findOne);

// Update a Announcement by id
router.put("/:id", [auth.authenticate], announcements.update);

// Delete a Announcement by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(AnnouncementModel));

export default router;
