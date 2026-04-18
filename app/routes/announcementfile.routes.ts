import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import AnnouncementFileModel from "../models/announcementfile.model.ts"
import { Router } from "express";
var router = Router()


// Create a new AnnouncementFile
router.post("/", [authenticate], generalcontroller.create(AnnouncementFileModel));

// Retrieve all AnnouncementFiles
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(AnnouncementFileModel));

// Retrieve a single AnnouncementFile by id
router.get("/:id", [authenticate], generalcontroller.findOne(AnnouncementFileModel));

//No update

// Delete a AnnouncementFile by id
router.delete("/:id", [authenticate], generalcontroller.delete(AnnouncementFileModel));

export default router;