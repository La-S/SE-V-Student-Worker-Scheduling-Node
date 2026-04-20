import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import setting from "../controllers/setting.controller.ts";
import SettingModel from "../models/setting.model.ts";

import { Router } from "express";

var router = Router();

// Create a new Setting
router.post("/", [authenticate, isAdminOnly], setting.create);

// Retrieve all Settings
router.get("/all", [authenticate, isAdminOnly], setting.findAll);

// Retrieve a single Setting by code
router.get("/:code", [authenticate, managerOrAdminOnly], setting.findOne);

// Update a Setting by code
router.put("/:code", [authenticate, managerOrAdminOnly], setting.update);

// Delete a Setting by code
router.delete("/:code", [authenticate, managerOrAdminOnly], setting.delete);

export default router;