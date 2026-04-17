// note as of now, any preferred request should be within an already existing available request.

import auth from "../authorization/authorization.ts";
import availabilityTemplates from "../controllers/availabilitytemplate.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import AvailabilityTemplateModel from "../models/availabilitytemplate.model.ts"
import { Router } from "express";
var router = Router()

//AvailabilityTemplate contains user on return, so any return route cannot be put to the general controller

// Create a new AvailabilityTemplate
router.post("/", [auth.authenticate], generalcontroller.create(AvailabilityTemplateModel));

// Retrieve all AvailabilityTemplates
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(AvailabilityTemplateModel));

// Retrieve a single AvailabilityTemplate by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(AvailabilityTemplateModel));

// Update a AvailabilityTemplate by id
router.put("/:id", [auth.authenticate], availabilityTemplates.update);

// Delete a AvailabilityTemplate by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(AvailabilityTemplateModel));

export default router;

