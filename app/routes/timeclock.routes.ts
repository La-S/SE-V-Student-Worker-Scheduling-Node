import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import TimeclockModel from "../models/timeclock.model.ts"
import timeclocks from "../controllers/timeclock.controller.ts"
import { Router } from "express";
var router = Router()


// Clock in, creates the time clock object, ACTUALLY WORKS AS POST
router.put("/:shiftId/clockin/:password", [auth.authenticate], timeclocks.clockIn);

//clock out, updates the timeclock's clockout time
router.put("/:shiftId/clockout", [auth.authenticate], timeclocks.clockOut);

//standard update
router.put("/:id", [auth.authenticate], generalcontroller.update(TimeclockModel));

// Delete a Timeclock by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(TimeclockModel));

export default router;