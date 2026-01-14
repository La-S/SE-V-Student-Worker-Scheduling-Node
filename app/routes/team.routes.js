import team from "../controllers/team.controller.js";
import auth from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()

// Create a new Team
router.post("/", [auth.authenticate, auth.isCoachAdmin], team.create);

// Find all the Teams (todo: idk why you'd ever do this and seems like a security concern but...)
router.get("/", [auth.authenticate], team.findAll);

// Retrieve a single Team with id
router.get("/:id", [auth.authenticate], team.findOne);

// Update a Team with id
router.put("/:id", [auth.authenticate, auth.isCoachAdmin], team.update);

// Delete a Team with id
router.delete("/:id", [auth.authenticate, auth.isCoachAdmin], team.delete);

router.post("/:id/users", [auth.authenticate, auth.isCoachAdmin], team.addUsers);

router.delete("/:id/users", [auth.authenticate, auth.isCoachAdmin], team.removeUsers);

router.get("/:id/users", [auth.authenticate], team.getUsers);

export default router