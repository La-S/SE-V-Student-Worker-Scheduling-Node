import set from "../controllers/set.controller.js";
import auth from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()

// Create a new set
router.post("/", [auth.authenticate], set.create);

// Find all the Sets
router.get("/", [auth.authenticate], set.findAll);

// Retrieve a single set with id
router.get("/:id", [auth.authenticate], set.findOne);

// Update a set with id
router.put("/:id", [auth.authenticate], set.update);

// Delete a set with id
router.delete("/:id", [auth.authenticate], set.delete);

router.post("/exercise/:id", [auth.authenticate], set.createMany);

export default router