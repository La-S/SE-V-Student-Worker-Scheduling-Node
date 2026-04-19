import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";
import businessUnitSettingValues from "../controllers/businessunitsettingvalue.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import BusinessUnitSettingValueModel from "../models/businessunitsettingvalue.model.ts"
import { Router } from "express";
var router = Router()


// Create a new BusinessUnitSettingValue
router.post("/", [authenticate], businessUnitSettingValues.create);

// Retrieve all BusinessUnitSettingValues
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(BusinessUnitSettingValueModel));

// Retrieve a single BusinessUnitSettingValue by id
router.get("/:id", [authenticate], businessUnitSettingValues.findOne);

// Update a BusinessUnitSettingValue by id
router.put("/:id", [authenticate], businessUnitSettingValues.update);

// Delete a BusinessUnitSettingValue by id
router.delete("/:id", [authenticate], generalcontroller.delete(BusinessUnitSettingValueModel));

export default router;

