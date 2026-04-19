import { authenticate, authorizeById, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import TimeOffRequestModel from "../models/timeoffrequest.model.ts";
import timeoffrequests from "../controllers/timeoffrequest.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Time Off Request
router.post("/", [authenticate], timeoffrequests.create);

// Retrieve all Time Off Request
router.get("/all", [authenticate, isAdminOnly], timeoffrequests.findAll);

// Retrieve a single Time Off Request by id
router.get("/:id", [authenticate], timeoffrequests.findOne);

// Update a Time Off Request by id
router.put("/:id", [authenticate], timeoffrequests.update);

// Delete a Time Off Request by id
router.delete("/:id", [authenticate], generalcontroller.delete(TimeOffRequestModel));

router.put("/:id/approve/:approverId", [authenticate, managerOrAdminOnly], timeoffrequests.approveTimeOffRequest);


export default router;

