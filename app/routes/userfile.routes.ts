import { authenticate, authorizeById, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import UserFileModel from "../models/userfile.model.ts"
import { Router } from "express";
var router = Router()


// Create a new UserFile
router.post("/", [authenticate], generalcontroller.create(UserFileModel));

// Retrieve all UserFiles
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(UserFileModel));

// Retrieve a single UserFile by id
router.get("/:id", [authenticate, authorizeById("userfile")], generalcontroller.findOne(UserFileModel));

//No update

// Delete a UserFile by id
router.delete("/:id", [authenticate, authorizeById("userfile")], generalcontroller.delete(UserFileModel));

export default router;