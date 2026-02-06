import users from "../controllers/user.controller.ts";
import auth from "../authorization/authorization.ts";
import { Router } from "express";
var router = Router()


// Create a new User
router.post("/", [auth.authenticate], users.create);

// Retrieve all People
router.get("/all", [auth.authenticate], users.findAll);

// Retrieve a single User with id
router.get("/:id", [auth.authenticate], users.findOne);

router.get("/email", [auth.authenticate], users.findByEmail);

// Update a User with idF
router.put("/:id", [auth.authenticate], users.update);

router.put("/:id/admin", [auth.authenticate, auth.isAdminOnly], users.updateIsAdmin)

// Delete a User with id
router.delete("/:id", [auth.authenticate], users.delete);

export default router;

