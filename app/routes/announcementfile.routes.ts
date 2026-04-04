import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import AnnouncementFileModel from "../models/announcementfile.model.ts"
import { Router } from "express";
var router = Router()


// Create a new AnnouncementFile
router.post("/", [auth.authenticate], generalcontroller.create(AnnouncementFileModel));

// Retrieve all AnnouncementFiles
router.get("/all", [auth.authenticate], generalcontroller.findAll(AnnouncementFileModel));

// Retrieve a single AnnouncementFile by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(AnnouncementFileModel));

//No update

// Delete a AnnouncementFile by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(AnnouncementFileModel));

export default router;