import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import PositionModel from "../models/position.model.ts";
import { Router } from "express";
var router = Router()


// Create a new Position
router.post("/", [auth.authenticate], generalcontroller.create(PositionModel));

// Retrieve all Positions
router.get("/all", [auth.authenticate], generalcontroller.findAll(PositionModel));

// Retrieve a single Position by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(PositionModel));

// Update a Position by id
router.put("/:id", [auth.authenticate], generalcontroller.update(PositionModel));

// Delete a Position by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(PositionModel));

export default router;

