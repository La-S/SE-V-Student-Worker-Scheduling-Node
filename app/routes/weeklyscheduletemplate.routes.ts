import auth from "../authorization/authorization.ts";
import generalcontroller from "../controllers/general.controller.ts"
import WeeklyScheduleTemplateModel from "../models/weeklyscheduletemplate.model.ts";
import weeklyscheduletemplates from "../controllers/weeklyscheduletemplate.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new WeeklyScheduleTemplate
router.post("/", [auth.authenticate], generalcontroller.create(WeeklyScheduleTemplateModel));

// Retrieve all WeeklyScheduleTemplates
router.get("/all", [auth.authenticate, auth.isAdminOnly], generalcontroller.findAll(WeeklyScheduleTemplateModel));

// Retrieve a single WeeklyScheduleTemplate by id
router.get("/:id", [auth.authenticate], weeklyscheduletemplates.findOne);

// WeeklyScheduleTemplate's attributes should not be updated. Post a new one
router.put("/:id", [auth.authenticate], weeklyscheduletemplates.update);

// Delete a WeeklyScheduleTemplate by id
router.delete("/:id", [auth.authenticate], generalcontroller.delete(WeeklyScheduleTemplateModel));

router.post("/fromshifts", [auth.authenticate], weeklyscheduletemplates.createFromShifts)

router.post("/loadshifts", [auth.authenticate], weeklyscheduletemplates.loadShifts)



export default router;

