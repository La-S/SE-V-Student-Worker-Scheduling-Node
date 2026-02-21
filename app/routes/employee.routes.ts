import auth from "../authorization/authorization.ts";
import employees from "../controllers/employee.controller.ts"
import generalcontroller from "../controllers/general.controller.ts"
import EmployeeModel from "../models/employee.model.ts"
import { Router } from "express";
var router = Router()

//Employee contains user on return, so any return route cannot be put to the general controller

// Create a new Employee
router.post("/", [auth.authenticate], generalcontroller.create(EmployeeModel));

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

export default router;

