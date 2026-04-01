import auth from "../authorization/authorization.ts";
import attachments from "../controllers/attachment.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import AttachmentModel from "../models/attachment.model.ts"
import { Router } from "express";
var router = Router()


// Create a new Attachment
router.post("/", [auth.authenticate], generalcontroller(AttachmentModel));

// Retrieve all Attachments
router.get("/all", [auth.authenticate], generalcontroller.findAll(AttachmentModel));

// Retrieve a single Attachment by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(AttachmentModel));

//No update

// Delete a Attachment by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(AttachmentModel));

export default router;