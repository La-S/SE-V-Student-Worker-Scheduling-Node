import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import BusinessUnitModel from "../models/businessunit.model.ts";
import businessunits from "../controllers/businessunit.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new BusinessUnit
router.post("/", [authenticate], generalcontroller.create(BusinessUnitModel));

// Retrieve all BusinessUnits
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(BusinessUnitModel));

// Retrieve a single BusinessUnit by id
router.get("/:id", [authenticate], generalcontroller.findOne(BusinessUnitModel));

// Update a BusinessUnit by id
router.put("/:id", [authenticate], generalcontroller.update(BusinessUnitModel));

// Delete a BusinessUnit by id
router.delete("/:id", [authenticate], generalcontroller.delete(BusinessUnitModel));

//get shifts for businessUnit
router.get("/:id/shifts", [authenticate], businessunits.findShifts)

router.get("/:id/tasklists", [authenticate], businessunits.findTaskLists);

router.get("/:id/availability", [authenticate], businessunits.findAvailabilityForDate)

router.get("/:id/availabilitytemplates", [authenticate], businessunits.findAvailabilityTemplates)

router.get("/:id/employees", [authenticate], businessunits.findEmployees)

router.get("/:id/positions", [authenticate], businessunits.findPositions)

router.get("/:id/weeklyscheduletemplates", [authenticate], businessunits.findWeeklySchedules)

router.put("/:id/shifts/:date/publish", [authenticate], businessunits.publishShiftsForWeek);

// get open hours for businessunit
router.get("/:id/openhours", [authenticate], businessunits.findOpenHours)

router.get("/:id/openhours/:dayOfWeek", [authenticate], businessunits.findOpenHoursForDay)

router.get("/:id/coverrequests", [authenticate], businessunits.getCoverRequests)

router.get("/:id/coverrequests/open/upcoming", [authenticate], businessunits.getUpcomingOpenCoverRequests)

router.get("/:id/droprequests", [authenticate], businessunits.getDropRequests)

router.get("/:id/droprequests/open/upcoming", [authenticate], businessunits.getUpcomingOpenDropRequests)

router.get("/:id/shifts/open", [authenticate], businessunits.findShifts)

router.get("/:id/budgetdaterange", [authenticate], businessunits.getBudgetInformationForDateRange);

router.delete("/:id/shifts/:date/week", [authenticate], businessunits.deleteShiftsForWeek);



export default router;
