import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";
//import userSettingValues from "../controllers/usersettingvalue.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import UserSettingValueModel from "../models/usersettingvalue.model.ts"
import { Router } from "express";
var router = Router()


// Create a new UserSettingValue
router.post("/", [authenticate], generalcontroller.create(UserSettingValueModel));

// Retrieve all UserSettingValues
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(UserSettingValueModel));

// Retrieve a single UserSettingValue by id
router.get("/:id", [authenticate], generalcontroller.findOne(UserSettingValueModel));

// Update a UserSettingValue by id
router.put("/:id", [authenticate], generalcontroller.update(UserSettingValueModel));

// Delete a UserSettingValue by id
router.delete("/:id", [authenticate], generalcontroller.delete(UserSettingValueModel));

export default router;