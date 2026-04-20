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

router.get("/email/:email", [authenticate, managerOrAdminOnly], users.findByEmail);

// Retrieve a single User with id
router.get("/:id", [authenticate, authorizeById("user")], users.findOne);

// Update a User with id
router.put("/:id", [authenticate, authorizeById("user")], users.update);

router.put("/:id/admin", [authenticate, isAdminOnly], users.updateIsAdmin)

// Delete a User with id
router.delete("/:id", [authenticate, authorizeById("user")], generalcontroller.delete(UserModel));

router.get("/:id/allEmployees", [authenticate, authorizeById("user")], users.findEmployeesForUser)

router.get("/:id/employees", [authenticate, authorizeById("user")], users.findActiveEmployeesForUser)

router.get("/:id/shifts", [authenticate, authorizeById("user")], users.findShiftsForDateRange)

router.get("/:id/availabilitytemplates/semester/:semester", [authenticate, authorizeById("user")], users.findAvailabilityTemplatesForSemester);

router.get("/:id/availabilitytemplates", [authenticate, authorizeById("user")], users.findAvailabilityTemplates);

router.get("/emaillike/:email", [authenticate, managerOrAdminOnly], users.findLikeEmail)

router.get("/:id/coverrequests/open/upcoming", [authenticate, authorizeById("user")], users.getUpcomingOpenCoverRequests);

router.get("/:id/announcementreceipts", [authenticate, authorizeById("user")], users.getAnnouncementReceipts);

router.get("/:id/userfiles", [authenticate, authorizeById("user")], users.getUserFiles);

router.get("/:id/timeoffrequests", [authenticate, authorizeById("user")], users.getTimeOffRequests);

router.delete("/:id/availabilitytemplates/semester/:semester", [authenticate, authorizeById("user")], users.clearAvailabilityTemplatesForSemester);

router.delete("/:id/availabilitytemplates", [authenticate, authorizeById("user")], users.clearAvailabilityTemplates);

router.get("/:id/expectedhours/:startdate", [authenticate, authorizeById("user")], users.getHoursForWeek);


export default router;

