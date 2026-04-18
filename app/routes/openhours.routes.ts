import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import openHours from "../controllers/openhours.controller.ts";
import OpenHoursModel from "../models/openhours.model.ts";
import { Router } from "express";
var router = Router()

// Create a new OpenHours
router.post("/", [authenticate], generalcontroller.create(OpenHoursModel));

// Retrieve all OpenHours
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(OpenHoursModel));

// Retrieve a single OpenHours by id
router.get("/:id", [authenticate], generalcontroller.findOne(OpenHoursModel));

// Update a OpenHours by id
router.put("/:id", [authenticate], openHours.update);

// Delete a OpenHours by id
router.delete("/:id", [authenticate], generalcontroller.delete(OpenHoursModel));

export default router;
