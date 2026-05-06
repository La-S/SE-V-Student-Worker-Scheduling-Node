import { authenticate, authorizeById, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";
import * as userSettingValues from "../controllers/usersettingvalue.controller.ts"
import * as generalcontroller from "../controllers/general.controller.ts"
import UserSettingValueModel from "../models/usersettingvalue.model.ts"
import { Router } from "express";
var router = Router()

//SHOULD NOT USE MOST OF THESE BESIDES PUT

// Create a new UserSettingValue
router.post("/", [authenticate, isAdminOnly], userSettingValues.create);

// Retrieve all UserSettingValues
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(UserSettingValueModel));

// Retrieve a single UserSettingValue by id
router.get("/:id", [authenticate, authorizeById("userSettingsValue")], userSettingValues.findOne);

// Update a UserSettingValue by id
router.put("/:id", [authenticate, authorizeById("userSettingsValue")], userSettingValues.update);

// Delete a UserSettingValue by id
router.delete("/:id", [authenticate, isAdminOnly], generalcontroller.delete(UserSettingValueModel));

export default router;