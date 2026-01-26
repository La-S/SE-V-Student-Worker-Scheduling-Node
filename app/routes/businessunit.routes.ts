import users from "../controllers/user.controller.js";
import auth from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()


// Create a new BusinessUnit
router.post("/", [auth.authenticate], BusinessUnit.create);

// Retrieve all BusinessUnits
router.get("/", [auth.authenticate], users.findAll);

// Retrieve a single BusinessUnit by id
router.get("/:id", [auth.authenticate], users.findOne);

// Update a BusinessUnit by id
router.put("/:id", [auth.authenticate], users.update);

// Delete a BusinessUnit by id
router.delete("/:id", [auth.authenticate], users.delete);

export default router;

