import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import TimeclockModel from "../models/timeclock.model.ts"
import timeclocks from "../controllers/timeclock.controller.ts"
import { Router } from "express";
var router = Router()


// Clock in, creates the time clock object
router.put("/:shiftId/clockin", [auth.authenticate], timeclocks.clockIn);

//clock out, updates the timeclock's clockout time
router.put("/:shiftId/clockout", [auth.authenticate], timeclocks.clockOut);

// Delete a Timeclock by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(TimeclockModel));

export default router;