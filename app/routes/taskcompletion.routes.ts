import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import * as generalcontroller from "../controllers/general.controller.ts"
import TaskCompletionModel from "../models/taskcompletion.model.ts";
import * as taskCompletions from "../controllers/taskcompletion.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new TaskCompletion
router.post("/", [authenticate], generalcontroller.create(TaskCompletionModel));

// Retrieve all TaskCompletions
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(TaskCompletionModel));

// Retrieve a single TaskCompletion by id
router.get("/:id", [authenticate], taskCompletions.findOne);

// Update a TaskCompletion by id
router.put("/:id", [authenticate], taskCompletions.update);

// Delete a TaskCompletion by id
router.delete("/:id", [authenticate, managerOrAdminOnly], generalcontroller.delete(TaskCompletionModel));

export default router;

