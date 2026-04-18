import users from "../controllers/user.controller.ts";
import { authenticate, authorizeById, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import UserModel from "../models/user.model.ts"
import { Router } from "express";
var router = Router()

//User has email validation checks, so some functions cannot be moved to general controller

// Create a new User
router.post("/", [authenticate, managerOrAdminOnly], users.create);

// Retrieve all People
router.get("/all", [authenticate, isAdminOnly], users.findAll);

router.get("/email/:email", [authenticate], users.findByEmail);

// Retrieve a single User with id
router.get("/:id", [authenticate], users.findOne); // , authorizeById("user")

// Update a User with id
router.put("/:id", [authenticate], users.update);

router.put("/:id/admin", [authenticate, isAdminOnly], users.updateIsAdmin)

// Delete a User with id
router.delete("/:id", [authenticate], generalcontroller.delete(UserModel));

router.get("/:id/employees", [authenticate], users.findEmployeesForUser)

router.get("/:id/shifts", [authenticate], users.findShiftsForDateRange)

router.get("/:id/availabilitytemplates", [authenticate], users.findAvailabilityTemplates);

router.get("/emaillike/:email", [authenticate], users.findLikeEmail)

router.get("/:id/coverrequests/open/upcoming", [authenticate], users.getUpcomingOpenCoverRequests);

router.get("/:id/announcementreceipts", [authenticate], users.getAnnouncementReceipts);

router.get("/:id/userfiles", [authenticate], users.getUserFiles);

export default router;

