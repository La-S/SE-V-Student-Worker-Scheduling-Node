import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import FileModel from "../models/file.model.ts"
import { Router } from "express";
var router = Router()


// Create a new File
router.post("/", [auth.authenticate], generalcontroller.create(FileModel));

// Retrieve all Files
router.get("/all", [auth.authenticate], generalcontroller.findAll(FileModel));

// Retrieve a single File by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(FileModel));

//No update

// Delete a File by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(FileModel));

export default router;