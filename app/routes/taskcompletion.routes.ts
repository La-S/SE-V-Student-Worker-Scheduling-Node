import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import TaskCompletionModel from "../models/taskcompletion.model.ts";
import taskCompletions from "../controllers/taskcompletion.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new TaskCompletion
router.post("/", [auth.authenticate], generalcontroller.create(TaskCompletionModel));

// Retrieve all TaskCompletions
router.get("/all", [auth.authenticate], generalcontroller.findAll(TaskCompletionModel));

// Retrieve a single TaskCompletion by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(TaskCompletionModel));

// Update a TaskCompletion by id
router.put("/:id", [auth.authenticate], taskCompletions.update);

// Delete a TaskCompletion by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(TaskCompletionModel));

export default router;

