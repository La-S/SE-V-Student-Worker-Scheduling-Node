import auth from "../authorization/authorization.js";
import businessunits from "../controllers/businessunit.controller.js"
import { Router } from "express";
var router = Router()


// Create a new BusinessUnit
router.post("/", [auth.authenticate], businessunits.create);

// Retrieve all BusinessUnits
router.get("/", [auth.authenticate], businessunits.findAll);

// Retrieve a single BusinessUnit by id
router.get("/:id", [auth.authenticate], businessunits.findOne);

// Update a BusinessUnit by id
router.put("/:id", [auth.authenticate], businessunits.update);

// Delete a BusinessUnit by id
router.delete("/:id", [auth.authenticate], businessunits.delete);

export default router;

