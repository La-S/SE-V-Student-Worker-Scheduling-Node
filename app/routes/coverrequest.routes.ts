import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import CoverRequestModel from "../models/coverrequest.model.ts";
import coverrequests from "../controllers/coverrequest.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Position
router.post("/", [auth.authenticate], generalcontroller.create(CoverRequestModel));

// Retrieve all Positions
router.get("/all", [auth.authenticate], coverrequests.findAll);

// Retrieve a single Position by id
router.get("/:id", [auth.authenticate], coverrequests.findOne);

// Update a Position by id
router.put("/:id", [auth.authenticate], coverrequests.update);

// Delete a Position by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(CoverRequestModel));

router.put("/:id/accept/:employeeId", [auth.authenticate], coverrequests.acceptCoverRequest);

router.put("/:id/approve/:approverId", [auth.authenticate], coverrequests.approveCoverRequest);


export default router;

