import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import BusinessUnitModel from "../models/businessunit.model.ts";
import { Router } from "express";
var router = Router()


// Create a new BusinessUnit
router.post("/", [auth.authenticate], generalcontroller.create(BusinessUnitModel));

// Retrieve all BusinessUnits
router.get("/all", [auth.authenticate], generalcontroller.findAll(BusinessUnitModel));

// Retrieve a single BusinessUnit by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(BusinessUnitModel));

// Update a BusinessUnit by id
router.put("/:id", [auth.authenticate], generalcontroller.update(BusinessUnitModel));

// Delete a BusinessUnit by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(BusinessUnitModel));

export default router;

