import { authenticate, authorizeById, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";
import * as businessUnitSettingValues from "../controllers/businessunitsettingvalue.controller.ts"
import * as generalcontroller from "../controllers/general.controller.ts"
import BusinessUnitSettingValueModel from "../models/businessunitsettingvalue.model.ts"
import { Router } from "express";
var router = Router()

//SHOULD NOT USE MOST OF THESE BESIDES PUT

// Create a new BusinessUnitSettingValue
router.post("/", [authenticate, isAdminOnly], businessUnitSettingValues.create);

// Retrieve all BusinessUnitSettingValues
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(BusinessUnitSettingValueModel));

// Retrieve a single BusinessUnitSettingValue by id
router.get("/:id", [authenticate, authorizeById("businessUnit")], businessUnitSettingValues.findOne);

// Update a BusinessUnitSettingValue by id
router.put("/:id", [authenticate, managerOrAdminOnly], businessUnitSettingValues.update);

// Delete a BusinessUnitSettingValue by id
router.delete("/:id", [authenticate, isAdminOnly], generalcontroller.delete(BusinessUnitSettingValueModel));

export default router;

