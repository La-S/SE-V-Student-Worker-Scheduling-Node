import auth from "../authorization/authorization.ts";
import employees from "../controllers/employee.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import AvailabilityTemplateModel from "../models/availabilitytemplate.model.ts"
import { Router } from "express";
var router = Router()

//AvailabilityTemplate contains user on return, so any return route cannot be put to the general controller

// Create a new AvailabilityTemplate
router.post("/", [auth.authenticate], generalcontroller.create(AvailabilityTemplateModel));

// Retrieve all AvailabilityTemplates
router.get("/all", [auth.authenticate], employees.findAll);

// Retrieve a single AvailabilityTemplate by id
router.get("/:id", [auth.authenticate], employees.findOne);

// Update a AvailabilityTemplate by id
router.put("/:id", [auth.authenticate], employees.update);

// Delete a AvailabilityTemplate by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(AvailabilityTemplateModel));

//Get shifts for employee
router.get("/:id/shifts", [auth.authenticate], employees.getShiftsForAvailabilityTemplate);

export default router;

