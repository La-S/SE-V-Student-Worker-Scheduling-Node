import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import WeeklyScheduleTemplateModel from "../models/weeklyscheduletemplate.model.ts";
import weeklyscheduletemplates from "../controllers/weeklyscheduletemplate.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new WeeklyScheduleTemplate
router.post("/", [authenticate], generalcontroller.create(WeeklyScheduleTemplateModel));

// Retrieve all WeeklyScheduleTemplates
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(WeeklyScheduleTemplateModel));

// Retrieve a single WeeklyScheduleTemplate by id
router.get("/:id", [authenticate], weeklyscheduletemplates.findOne);

// WeeklyScheduleTemplate's attributes should not be updated. Post a new one
router.put("/:id", [authenticate, managerOrAdminOnly], weeklyscheduletemplates.update);

// Delete a WeeklyScheduleTemplate by id
router.delete("/:id", [authenticate, managerOrAdminOnly], generalcontroller.delete(WeeklyScheduleTemplateModel));

router.post("/fromshifts", [authenticate], weeklyscheduletemplates.createFromShifts)

router.post("/loadshifts", [authenticate], weeklyscheduletemplates.loadShifts)



export default router;

