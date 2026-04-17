import auth from "../authorization/authorization.ts";
import settings from "../controllers/settings.controller.ts";
import generalcontroller from "../controllers/general.controller.ts";
import SettingsModel from "../models/settings.model.ts";

import { Router } from "express";

var router = Router();

// Create a new Setting
router.post("/", [auth.authenticate], settings.create);

// Retrieve all Settings
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(SettingsModel));

// Retrieve a single Setting by code
router.get("/:code", [auth.authenticate], settings.findOne);

// Update a Setting by code
router.put("/:code", [auth.authenticate], settings.update);

// Delete a Setting by code
router.delete("/:code", [auth.authenticate], settings.delete);

export default router;