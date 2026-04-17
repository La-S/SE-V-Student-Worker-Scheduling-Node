import auth from "../authorization/authorization.ts";
import employees from "../controllers/employee.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import EmployeeModel from "../models/employee.model.ts"
import { Router } from "express";
var router = Router()

//Employee contains user on return, so any return route cannot be put to the general controller

// Create a new Employee
router.post("/", [auth.authenticate, auth.authorizeById("employee")], employees.create);

// Retrieve all Employees
router.get("/all", [auth.authenticate, auth.isAdminOnly], employees.findAll);

// Retrieve a single Employee by id
router.get("/:id", [auth.authenticate, auth.authorizeById("employee")], employees.findOne);

// Update a Employee by id
router.put("/:id", [auth.authenticate, auth.authorizeById("employee")], employees.update);

// Delete a Employee by id
router.delete("/:id", [auth.authenticate, auth.authorizeById("employee")], employees.delete);

router.delete("/:id/permanent", [auth.authenticate, auth.authorizeById("employee")], generalcontroller.delete(EmployeeModel));


//Get shifts for employee
router.get("/:id/shifts", [auth.authenticate, auth.authorizeById("employee")], employees.findShifts);

router.get("/:id/availabilitytemplates", [auth.authenticate, auth.authorizeById("employee")], employees.findAvailabilityTemplates)

router.post("/:id/position/:positionid", [auth.authenticate, auth.authorizeById("employee")], employees.addPosition)

router.delete("/:id/position/:positionid", [auth.authenticate, auth.authorizeById("employee")], employees.removePosition)

router.get("/:id/positions", [auth.authenticate, auth.authorizeById("employee")], employees.findPositions)

router.get("/:id/coverrequests", [auth.authenticate, auth.authorizeById("employee")], employees.getCoverRequests);

router.get("/:id/availablecoverrequests", [auth.authenticate, auth.authorizeById("employee")], employees.getAvailableCoverRequests)

router.get("/:id/droprequests", [auth.authenticate, auth.authorizeById("employee")], employees.getDropRequests);

router.delete("/:id/clearavailability", [auth.authenticate, auth.authorizeById("employee")], employees.clearAvailabilityTemplates);

router.post("/:id/loadclasses", [auth.authenticate, auth.authorizeById("employee")], employees.importEmployeeClasses);

router.get("/:id/announcementreceipts", [auth.authenticate, auth.authorizeById("employee")], employees.getAvailableAnnouncementReceipts);

router.get("/:id/announcements/author", [auth.authenticate, auth.authorizeById("employee")], employees.findAuthoredAnnouncements);

router.get("/:id/openshifts", [auth.authenticate, auth.authorizeById("employee")], employees.getAvailableOpenShifts);

router.get("/:id/budgetdaterange/", [auth.authenticate, auth.authorizeById("employee")], employees.getBudgetForDateRange);


export default router;

