import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import * as announcementreceipts from "../controllers/announcementreceipt.controller.ts"
import * as generalcontroller from "../controllers/general.controller.ts"
import AnnouncementReceiptModel from "../models/announcementreceipt.model.ts"
import { Router } from "express";
var router = Router()

//most of these shouldn't be used but I thought it'd be nice to have CRUD still just in case

// Create a new Announcement Receipt
router.post("/", [authenticate], announcementreceipts.create);

// Retrieve all Announcement Receipts
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(AnnouncementReceiptModel));

// Retrieve a single Announcement Receipt by id
router.get("/:id", [authenticate], announcementreceipts.findOne);

// Update a Announcement Receipt by id
router.put("/:id", [authenticate], announcementreceipts.update);

// Delete a Announcement Receipt by id - DO NOT USE
router.delete("/:id/permanent", [authenticate], generalcontroller.delete(AnnouncementReceiptModel));

//actually just sets deleted to true, use most of the time
router.delete("/:id", [authenticate], announcementreceipts.setDeleted);

//sets announcement receipt to read
router.put("/:id/read", [authenticate], announcementreceipts.setRead);

export default router;

