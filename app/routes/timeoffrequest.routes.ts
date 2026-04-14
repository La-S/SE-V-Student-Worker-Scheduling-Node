import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import TimeOffRequestModel from "../models/timeoffrequest.model.ts";
import timeoffrequests from "../controllers/timeoffrequest.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Time Off Request
router.post("/", [auth.authenticate], timeoffrequests.create);

// Retrieve all Time Off Request
router.get("/all", [auth.authenticate], timeoffrequests.findAll);

// Retrieve a single Time Off Request by id
router.get("/:id", [auth.authenticate], timeoffrequests.findOne);

// Update a Time Off Request by id
router.put("/:id", [auth.authenticate], timeoffrequests.update);

// Delete a Time Off Request by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(TimeOffRequestModel));

router.put("/:id/approve/:approverId", [auth.authenticate], timeoffrequests.approveTimeOffRequest);


export default router;

