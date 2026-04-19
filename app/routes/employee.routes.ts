import { authenticate, authorizeById, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import employees from "../controllers/employee.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import EmployeeModel from "../models/employee.model.ts"
import { Router } from "express";
var router = Router()

//Employee contains user on return, so any return route cannot be put to the general controller

// Create a new Employee
router.post("/", [authenticate, managerOrAdminOnly], employees.create);

// Retrieve all Employees
router.get("/all", [authenticate, isAdminOnly], employees.findAll);

// Retrieve a single Employee by id
router.get("/:id", [authenticate, authorizeById("employee")], employees.findOne);

// Update a Employee by id
router.put("/:id", [authenticate, authorizeById("employee")], employees.update);

// Delete a Employee by id
router.delete("/:id", [authenticate, authorizeById("employee")], employees.delete);

router.delete("/:id/permanent", [authenticate, authorizeById("employee")], generalcontroller.delete(EmployeeModel));


//Get shifts for employee
router.get("/:id/shifts", [authenticate, authorizeById("employee")], employees.findShifts);

router.get("/:id/availabilitytemplates", [authenticate, authorizeById("employee")], employees.findAvailabilityTemplates)

router.post("/:id/position/:positionid", [authenticate, authorizeById("employee")], employees.addPosition)

router.delete("/:id/position/:positionid", [authenticate, authorizeById("employee")], employees.removePosition)

router.get("/:id/positions", [authenticate, authorizeById("employee")], employees.findPositions)

router.get("/:id/coverrequests", [authenticate, authorizeById("employee")], employees.getCoverRequests);

router.get("/:id/availablecoverrequests", [authenticate, authorizeById("employee")], employees.getAvailableCoverRequests)

router.get("/:id/droprequests", [authenticate, authorizeById("employee")], employees.getDropRequests);

router.delete("/:id/clearavailability", [authenticate, authorizeById("employee")], employees.clearAvailabilityTemplates);

router.post("/:id/loadclasses", [authenticate, authorizeById("employee")], employees.importEmployeeClasses);

router.get("/:id/announcementreceipts", [authenticate, authorizeById("employee")], employees.getAvailableAnnouncementReceipts);

router.get("/:id/announcements/author", [authenticate, authorizeById("employee")], employees.findAuthoredAnnouncements);

router.get("/:id/openshifts", [authenticate, authorizeById("employee")], employees.getAvailableOpenShifts);

router.get("/:id/budgetdaterange/", [authenticate, authorizeById("employee")], employees.getBudgetForDateRange);


export default router;

