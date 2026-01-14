import exerciseTemplate from "../controllers/exerciseTemplate.controller.js";
import auth from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()


// Create a new exerciseTemplate
router.post("/", [auth.authenticate, auth.isCoachAdmin], exerciseTemplate.create);

// Retrieve all exerciseTemplates
router.get("/", [auth.authenticate], exerciseTemplate.findAll);

// Retrieve a single exerciseTemplate with id
router.get("/:id", [auth.authenticate], exerciseTemplate.findOne);

// Update an exerciseTemplate with id
router.put("/:id", [auth.authenticate, auth.isCoachAdmin], exerciseTemplate.update);

// Delete an exerciseTemplate with id
router.delete("/:id", [auth.authenticate, auth.isCoachAdmin], exerciseTemplate.delete);


export default router;

