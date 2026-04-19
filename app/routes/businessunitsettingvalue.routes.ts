import auth from "../authorization/authorization.ts";
import businessUnitSettingValues from "../controllers/businessunitsettingvalue.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import BusinessUnitSettingValueModel from "../models/businessunitsettingvalue.model.ts"
import { Router } from "express";
var router = Router()


// Create a new BusinessUnitSettingValue
router.post("/", [auth.authenticate], generalcontroller.create(BusinessUnitSettingValueModel));

// Retrieve all BusinessUnitSettingValues
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(BusinessUnitSettingValueModel));

// Retrieve a single BusinessUnitSettingValue by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(BusinessUnitSettingValueModel));

// Update a BusinessUnitSettingValue by id
router.put("/:id", [auth.authenticate], businessUnitSettingValues.update);

// Delete a BusinessUnitSettingValue by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(BusinessUnitSettingValueModel));

export default router;

