import auth from "../authorization/authorization.ts";
import employees from "../controllers/employee.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import EmployeeModel from "../models/employee.model.ts"
import { Router } from "express";
var router = Router()

//Employee contains user on return, so any return route cannot be put to the general controller

// Create a new Employee
router.post("/", [auth.authenticate], employees.create);

// Retrieve all Employees
router.get("/all", [auth.authenticate], employees.findAll);

// Retrieve a single Employee by id
router.get("/:id", [auth.authenticate], employees.findOne);

// Update a Employee by id
router.put("/:id", [auth.authenticate], employees.update);

// Delete a Employee by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(EmployeeModel));

//Get shifts for employee
router.get("/:id/shifts", [auth.authenticate], employees.findShifts);

router.get("/:id/availabilitytemplates", [auth.authenticate], employees.findAvailabilityTemplates)

router.post("/:id/position/:positionid", [auth.authenticate], employees.addPosition)

router.delete("/:id/position/:positionid", [auth.authenticate], employees.removePosition)

router.get("/:id/positions", [auth.authenticate], employees.findPositions)

router.get("/:id/coverrequests", [auth.authenticate], employees.getCoverRequests);

router.get("/:id/availablecoverrequests", [auth.authenticate], employees.getAvailableCoverRequests)

router.get("/:id/droprequests", [auth.authenticate], employees.getDropRequests);

router.delete("/:id/clearavailability", [auth.authenticate], employees.clearAvailabilityTemplates);

router.post("/:id/loadclasses", [auth.authenticate], employees.importEmployeeClasses);

router.get("/:id/announcementreceipts", [auth.authenticate], employees.getAvailableAnnouncementReceipts);

router.get("/:id/announcements/author", [auth.authenticate], employees.findAuthoredAnnouncements);

router.get("/:id/openshifts", [auth.authenticate], employees.getAvailableOpenShifts);


export default router;

