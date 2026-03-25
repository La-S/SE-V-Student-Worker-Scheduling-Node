import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import DropRequestModel from "../models/droprequest.model.ts";
import droprequests from "../controllers/droprequest.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new Position
router.post("/", [auth.authenticate], generalcontroller.create(DropRequestModel));

// Retrieve all Positions
router.get("/all", [auth.authenticate], droprequests.findAll);

// Retrieve a single Position by id
router.get("/:id", [auth.authenticate], droprequests.findOne);

// Update a Position by id
router.put("/:id", [auth.authenticate], droprequests.update);

// Delete a Position by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(DropRequestModel));

router.put("/:id/approve/:approverId", [auth.authenticate], droprequests.approveDropRequest);


export default router;

