import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import settings from "../controllers/settings.controller.ts";
import generalcontroller from "../controllers/general.controller.ts";
import SettingsModel from "../models/settings.model.ts";

import { Router } from "express";

var router = Router();

// Create a new Setting
router.post("/", [authenticate, isAdminOnly], settings.create);

// Retrieve all Settings
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(SettingsModel));

// Retrieve a single Setting by code
router.get("/:code", [authenticate, managerOrAdminOnly], settings.findOne);

// Update a Setting by code
router.put("/:code", [authenticate, managerOrAdminOnly], settings.update);

// Delete a Setting by code
router.delete("/:code", [authenticate, managerOrAdminOnly], settings.delete);

export default router;