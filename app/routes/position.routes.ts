import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import PositionModel from "../models/position.model.ts";
import positions from "../controllers/position.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Position
router.post("/", [authenticate], generalcontroller.create(PositionModel));

// Retrieve all Positions
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(PositionModel));

// Retrieve a single Position by id
router.get("/:id", [authenticate], generalcontroller.findOne(PositionModel));

// Update a Position by id
router.put("/:id", [authenticate], positions.update);

// Delete a Position by id
router.delete("/:id", [authenticate], generalcontroller.delete(PositionModel));

router.get("/:id/employees", [authenticate], positions.findEmployees)

export default router;

