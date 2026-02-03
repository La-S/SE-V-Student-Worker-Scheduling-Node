import auth from "../authorization/authorization.ts";
import employees from "../controllers/employee.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Employee
router.post("/", [auth.authenticate], employees.create);

// Retrieve all Employees
router.get("/", [auth.authenticate], employees.findAll);

// Retrieve a single Employee by id
router.get("/:id", [auth.authenticate], employees.findOne);

// Update a Employee by id
router.put("/:id", [auth.authenticate], employees.update);

// Delete a Employee by id
router.delete("/:id", [auth.authenticate], employees.delete);

export default router;

