import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import FileModel from "../models/file.model.ts"
import files from "../controllers/file.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new File
router.post("/", [authenticate], generalcontroller.create(FileModel));

// Retrieve all Files
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(FileModel));

// Retrieve a single File by id
router.get("/:id", [authenticate], files.findOne);

//No update

// Delete a File by id
router.delete("/:id", [authenticate], files.delete);

export default router;