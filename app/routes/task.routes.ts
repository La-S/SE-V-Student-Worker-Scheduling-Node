import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import TaskModel from "../models/task.model.ts";
import tasks from "../controllers/task.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Task
router.post("/", [auth.authenticate], tasks.create);

// Retrieve all Tasks
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(TaskModel));

// Retrieve a single Task by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(TaskModel));

// Update a Task by id
router.put("/:id", [auth.authenticate], tasks.update);

// Delete a Task by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(TaskModel));

export default router;

