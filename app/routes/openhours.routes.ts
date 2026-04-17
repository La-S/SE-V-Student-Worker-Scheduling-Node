import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import openHours from "../controllers/openhours.controller.ts";
import OpenHoursModel from "../models/openhours.model.ts";
import { Router } from "express";
var router = Router()

// Create a new OpenHours
router.post("/", [auth.authenticate], generalcontroller.create(OpenHoursModel));

// Retrieve all OpenHours
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(OpenHoursModel));

// Retrieve a single OpenHours by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(OpenHoursModel));

// Update a OpenHours by id
router.put("/:id", [auth.authenticate], openHours.update);

// Delete a OpenHours by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(OpenHoursModel));

export default router;
