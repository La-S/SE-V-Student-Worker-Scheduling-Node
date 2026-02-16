import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import TaskListItemModel from "../models/tasklistitem.model.ts";
import taskListItems from "../controllers/tasklistitem.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new TaskListItem
router.post("/", [auth.authenticate], generalcontroller.create(TaskListItemModel));

// Retrieve all TaskListItems
router.get("/all", [auth.authenticate], generalcontroller.findAll(TaskListItemModel));

// Retrieve a single TaskListItem by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(TaskListItemModel));

// Update a TaskListItem by id
router.put("/:id", [auth.authenticate], taskListItems.update);

// Delete a TaskListItem by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(TaskListItemModel));

export default router;

