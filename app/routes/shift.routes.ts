import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import ShiftModel from "../models/shift.model.ts";
import shifts from "../controllers/shift.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Shift
router.post("/", [auth.authenticate], shifts.create);

// Retrieve all Shifts
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(ShiftModel));

// Retrieve a single Shift by id
router.get("/:id", [auth.authenticate], shifts.findOne);

// Update a Shift by id
router.put("/:id", [auth.authenticate], shifts.update);

// Delete a Shift by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(ShiftModel));

//add TaskList to shift
router.post("/:id/tasklist/:tasklistid", [auth.authenticate], shifts.addTaskList);

//remove TaskList from shift
router.delete("/:id/tasklist/:tasklistid", [auth.authenticate], shifts.removeTaskList);


export default router;

