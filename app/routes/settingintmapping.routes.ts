import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";
import settingIntMappings from "../controllers/settingintmapping.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import SettingIntMappingModel from "../models/settingintmapping.model.ts"
import { Router } from "express";
var router = Router()

//PLEASE USE SETTINGS POST/PUT TO UPDATE SETTING INT MAPPINGS

// // Create a new SettingIntMappingSettingValue
// router.post("/", [authenticate, isAdminOnly], settingIntMappings.create);

// Retrieve all SettingIntMappingSettingValues
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(SettingIntMappingModel));

// Retrieve a single SettingIntMappingSettingValue by id
router.get("/:id", [authenticate], settingIntMappings.findOne);

// // Update a SettingIntMappingSettingValue by id
// router.put("/:id", [authenticate, isAdminOnly], settingIntMappings.update);

// // Delete a SettingIntMappingSettingValue by id
// router.delete("/:id", [authenticate, isAdminOnly], settingIntMappings.delete);

export default router;