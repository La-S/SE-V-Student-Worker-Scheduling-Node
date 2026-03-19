import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import BusinessUnitModel from "../models/businessunit.model.ts";
import businessunits from "../controllers/businessunit.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new BusinessUnit
router.post("/", [auth.authenticate], generalcontroller.create(BusinessUnitModel));

// Retrieve all BusinessUnits
router.get("/all", [auth.authenticate], generalcontroller.findAll(BusinessUnitModel));

// Retrieve a single BusinessUnit by id
router.get("/:id", [auth.authenticate], generalcontroller.findOne(BusinessUnitModel));

// Update a BusinessUnit by id
router.put("/:id", [auth.authenticate], generalcontroller.update(BusinessUnitModel));

// Delete a BusinessUnit by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(BusinessUnitModel));

//get shifts for businessUnit
router.get("/:id/shifts", [auth.authenticate], businessunits.findShifts)

router.get("/:id/tasklists", [auth.authenticate], businessunits.findTaskLists);

router.get("/:id/availability", [auth.authenticate], businessunits.findAvailabilityForDate)

router.get("/:id/availabilitytemplates", [auth.authenticate], businessunits.findAvailabilityTemplates)

router.get("/:id/employees", [auth.authenticate], businessunits.findEmployees)

router.get("/:id/positions", [auth.authenticate], businessunits.findPositions)

router.get("/:id/weeklyscheduletemplates", [auth.authenticate], businessunits.findWeeklySchedules)

router.put("/:id/shifts/:date/publish", [auth.authenticate], businessunits.publishShiftsForWeek);

// get open hours for businessunit
router.get("/:id/openhours", [auth.authenticate], businessunits.findOpenHours)

router.get("/:id/openhours/:dayOfWeek", [auth.authenticate], businessunits.findOpenHoursForDay)

router.get("/:id/coverrequests", [auth.authenticate], businessunits.getCoverRequests)

export default router;
