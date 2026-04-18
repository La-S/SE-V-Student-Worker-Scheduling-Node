import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import UserFileModel from "../models/userfile.model.ts"
import { Router } from "express";
var router = Router()


// Create a new UserFile
router.post("/", [auth.authenticate], generalcontroller.create(UserFileModel));

// Retrieve all UserFiles
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(UserFileModel));

// Retrieve a single UserFile by id
router.get("/:id", [auth.authenticate, auth.authorizeById("userfile")], generalcontroller.findOne(UserFileModel));

//No update

// Delete a UserFile by id
router.delete("/:id", [auth.authenticate, auth.authorizeById("userfile")], generalcontroller.delete(UserFileModel));

export default router;