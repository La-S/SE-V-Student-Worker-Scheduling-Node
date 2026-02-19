import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import TaskListModel from "../models/tasklist.model.ts";
import taskLists from "../controllers/tasklist.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new TaskList
router.post("/", [auth.authenticate], generalcontroller.create(TaskListModel));

// Retrieve all TaskLists
router.get("/all", [auth.authenticate], generalcontroller.findAll(TaskListModel));

// Retrieve a single TaskList by id
router.get("/:id", [auth.authenticate], taskLists.findOne);

// Update a TaskList by id
router.put("/:id", [auth.authenticate], taskLists.update);

// Delete a TaskList by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(TaskListModel));

export default router;

