import users from "../controllers/user.controller.js";
import auth from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()


// Create a new User
router.post("/", [auth.authenticate], users.create);

// Retrieve all People
router.get("/", [auth.authenticate], users.findAll);

// Retrieve a single User with id
router.get("/:id", [auth.authenticate], users.findOne);

// Update a User with idF
router.put("/:id", [auth.authenticate], users.update);

router.put("/:id/role", [auth.authenticate, auth.isAdminOnly], users.updateRole)

// Delete a User with id
router.delete("/:id", [auth.authenticate], users.delete);

export default router;

