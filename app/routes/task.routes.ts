import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import TaskModel from "../models/task.model.ts";
import tasks from "../controllers/task.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Task
router.post("/", [authenticate], tasks.create);

// Retrieve all Tasks
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(TaskModel));

// Retrieve a single Task by id
router.get("/:id", [authenticate], generalcontroller.findOne(TaskModel));

// Update a Task by id
router.put("/:id", [authenticate], tasks.update);

// Delete a Task by id
router.delete("/:id", [authenticate], generalcontroller.delete(TaskModel));

export default router;

