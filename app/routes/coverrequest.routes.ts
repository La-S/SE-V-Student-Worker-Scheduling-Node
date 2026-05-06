import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import * as generalcontroller from "../controllers/general.controller.ts"
import CoverRequestModel from "../models/coverrequest.model.ts";
import * as coverrequests from "../controllers/coverrequest.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new CoverRequest
router.post("/", [authenticate], coverrequests.create);

// Retrieve all CoverRequests
router.get("/all", [authenticate, isAdminOnly], coverrequests.findAll);

// Retrieve a single CoverRequest by id
router.get("/:id", [authenticate], coverrequests.findOne);

// Update a CoverRequest by id
router.put("/:id", [authenticate], coverrequests.update);

// Delete a CoverRequest by id
router.delete("/:id", [authenticate], generalcontroller.delete(CoverRequestModel));

router.put("/:id/accept/:employeeId", [authenticate], coverrequests.acceptCoverRequest);

router.put("/:id/approve/:approverId", [authenticate], coverrequests.approveCoverRequest);


export default router;

