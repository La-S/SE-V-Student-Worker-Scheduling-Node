import auth from "../authorization/authorization.ts";
import announcementreceipts from "../controllers/announcementreceipt.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import AnnouncementModel from "../models/announcement.model.ts"
import { Router } from "express";
var router = Router()


// Create a new Announcement
router.post("/", [auth.authenticate], announcementreceipts.create);

// Retrieve all Announcements
router.get("/all", [auth.authenticate], generalcontroller.findAll(AnnouncementModel));

// Retrieve a single Announcement by id
router.get("/:id", [auth.authenticate], announcementreceipts.findOne);

// Update a Announcement by id
router.put("/:id", [auth.authenticate], announcementreceipts.update);

// Delete a Announcement by id
router.delete("/:id/permanent", [auth.authenticate], generalcontroller.delete(AnnouncementModel));

//actually just sets deleted to true, use most of the time
router.delete("/:id", [auth.authenticate], announcementreceipts.setDeleted);

router.put("/:id/read", [auth.authenticate], announcementreceipts.setRead);

export default router;

