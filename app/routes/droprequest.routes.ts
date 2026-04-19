import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import DropRequestModel from "../models/droprequest.model.ts";
import droprequests from "../controllers/droprequest.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Drop Request
router.post("/", [authenticate], droprequests.create);

// Retrieve all Drop Request
router.get("/all", [authenticate, isAdminOnly], droprequests.findAll);

// Retrieve a single Drop Request by id
router.get("/:id", [authenticate], droprequests.findOne);

// Update a Drop Request by id
router.put("/:id", [authenticate], droprequests.update);

// Delete a Drop Request by id
router.delete("/:id", [authenticate], generalcontroller.delete(DropRequestModel));

router.put("/:id/approve/:approverId", [authenticate], droprequests.approveDropRequest);


export default router;

