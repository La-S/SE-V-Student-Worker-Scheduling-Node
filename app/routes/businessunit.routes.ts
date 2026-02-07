import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import BusinessUnit from "../models/businessunit.model.ts";
import businessunits from "../controllers/businessunit.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new BusinessUnit
router.post("/", [auth.authenticate], generalcontroller.create(BusinessUnit));

// Retrieve all BusinessUnits
router.get("/all", [auth.authenticate], generalcontroller.findAll(BusinessUnit));

// Retrieve a single BusinessUnit by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(BusinessUnit));

// Update a BusinessUnit by id
router.put("/:id", [auth.authenticate], generalcontroller.update(BusinessUnit));

// Delete a BusinessUnit by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(BusinessUnit));

export default router;

