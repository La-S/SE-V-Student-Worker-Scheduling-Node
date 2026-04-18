import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import ShiftModel from "../models/shift.model.ts";
import shifts from "../controllers/shift.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Shift
router.post("/", [authenticate], shifts.create);

// Retrieve all Shifts
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(ShiftModel));

// Retrieve a single Shift by id
router.get("/:id", [authenticate], shifts.findOne);

// Update a Shift by id
router.put("/:id", [authenticate], shifts.update);

// Delete a Shift by id
router.delete("/:id", [authenticate, managerOrAdminOnly], generalcontroller.delete(ShiftModel));

//add TaskList to shift
router.post("/:id/tasklist/:tasklistid", [authenticate, managerOrAdminOnly], shifts.addTaskList);

//remove TaskList from shift
router.delete("/:id/tasklist/:tasklistid", [authenticate, managerOrAdminOnly], shifts.removeTaskList);


export default router;

