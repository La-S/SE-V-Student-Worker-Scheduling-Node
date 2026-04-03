import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import FileModel from "../models/file.model.ts"
import files from "../controllers/file.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new File
router.post("/", [auth.authenticate], generalcontroller.create(FileModel));

// Retrieve all Files
router.get("/all", [auth.authenticate], generalcontroller.findAll(FileModel));

// Retrieve a single File by id
router.get("/:id", [auth.authenticate], files.findOne);

//No update

// Delete a File by id
router.delete("/:id", [auth.authenticate], files.delete);

export default router;