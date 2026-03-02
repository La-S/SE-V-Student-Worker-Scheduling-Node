import users from "../controllers/user.controller.ts";
import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import UserModel from "../models/user.model.ts"
import { Router } from "express";
var router = Router()

//User has email validation checks, so some functions cannot be moved to general controller

// Create a new User
router.post("/", [auth.authenticate], users.create);

// Retrieve all People
router.get("/all", [auth.authenticate], generalcontroller.findAll(UserModel));

router.get("/email", [auth.authenticate], users.findByEmail);

// Retrieve a single User with id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(UserModel));

// Update a User with idF
router.put("/:id", [auth.authenticate], users.update);

router.put("/:id/admin", [auth.authenticate, auth.isAdminOnly], users.updateIsAdmin)

// Delete a User with id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(UserModel));

router.get("/:id/employees", [auth.authenticate], users.findEmployeesForUser)

router.get("/:id/shifts", [auth.authenticate], users.findShiftsForDateRange)

router.get("/:id/availabilitytemplates", [auth.authenticate], users.findAvailabilityTemplates);

export default router;

