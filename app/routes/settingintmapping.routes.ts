import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";
import settingIntMappings from "../controllers/settingintmapping.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import SettingIntMappingModel from "../models/settingintmapping.model.ts"
import { Router } from "express";
var router = Router()


// Create a new SettingIntMappingSettingValue
router.post("/", [authenticate], settingIntMappings.create);

// Retrieve all SettingIntMappingSettingValues
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(SettingIntMappingModel));

// Retrieve a single SettingIntMappingSettingValue by id
router.get("/:id", [authenticate], settingIntMappings.findOne);

// Update a SettingIntMappingSettingValue by id
router.put("/:id", [authenticate], settingIntMappings.update);

// Delete a SettingIntMappingSettingValue by id
router.delete("/:id", [authenticate], generalcontroller.delete(SettingIntMappingModel));

export default router;