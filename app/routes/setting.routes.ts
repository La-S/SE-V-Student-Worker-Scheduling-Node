import auth from "../authorization/authorization.ts";
import setting from "../controllers/setting.controller.ts";
import generalcontroller from "../controllers/general.controller.ts";
import SettingModel from "../models/setting.model.ts";

import { Router } from "express";

var router = Router();

// Create a new Setting
router.post("/", [auth.authenticate], setting.create);

// Retrieve all Setting
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(SettingModel));

// Retrieve a single Setting by code
router.get("/:code", [auth.authenticate], setting.findOne);

// Update a Setting by code
router.put("/:code", [auth.authenticate], setting.update);

// Delete a Setting by code
router.delete("/:code", [auth.authenticate], setting.delete);

export default router;