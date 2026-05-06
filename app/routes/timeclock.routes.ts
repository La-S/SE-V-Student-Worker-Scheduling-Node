import { authenticate, managerOrAdminOnly, terminalAuthenticate } from "../authorization/authorization.ts";

import * as generalcontroller from "../controllers/general.controller.ts"
import TimeclockModel from "../models/timeclock.model.ts"
import * as timeclocks from "../controllers/timeclock.controller.ts"
import { Router } from "express";
var router = Router()

router.post("/", [authenticate], timeclocks.create)

// Clock in, creates the time clock object, ACTUALLY WORKS AS POST
router.put("/:shiftId/clockin/:password", [terminalAuthenticate], timeclocks.clockIn);

//clock out, updates the timeclock's clockout time
router.put("/:shiftId/clockout", [terminalAuthenticate], timeclocks.clockOut);

//standard update
router.put("/:id", [authenticate, managerOrAdminOnly], timeclocks.update);

// Delete a Timeclock by id
router.delete("/:id", [authenticate, managerOrAdminOnly], generalcontroller.delete(TimeclockModel));

export default router;