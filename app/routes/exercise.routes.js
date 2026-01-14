import exercise from "../controllers/exercise.controller.js";
import auth from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()


// Create a new User
router.post("/", [auth.authenticate], exercise.create);

// Retrieve all People
router.get("/", [auth.authenticate], exercise.findAll);

// Retrieve a single User with id
router.get("/:id", [auth.authenticate], exercise.findOne);

// Update a User with id
router.put("/:id", [auth.authenticate], exercise.update);

// Delete a User with id
router.delete("/:id", [auth.authenticate], exercise.delete);

router.get("/:id/sets", [auth.authenticate], exercise.getSets);

router.post("/workout/:id", [auth.authenticate], exercise.createMany);

router.post("/workout/:id/sets", [auth.authenticate, auth.isCoachAdmin], exercise.createManyWithSets);


export default router;

