import { authenticate, isAdminOnly, managerOrAdminOnly } from "../authorization/authorization.ts";

import generalcontroller from "../controllers/general.controller.ts"
import DailyScheduleTemplateModel from "../models/dailyscheduletemplate.model.ts";
// import dailyscheduletemplates from "../controllers/dailyscheduletemplate.controller.ts"
import { Router } from "express";
var router = Router()


// Create a new DailyScheduleTemplate
router.post("/", [authenticate], generalcontroller.create(DailyScheduleTemplateModel));

// Retrieve all DailyScheduleTemplates
router.get("/all", [authenticate, isAdminOnly], generalcontroller.findAll(DailyScheduleTemplateModel));

// Retrieve a single DailyScheduleTemplate by id
router.get("/:id", [authenticate], generalcontroller.findOne(DailyScheduleTemplateModel));

// DailyScheduleTemplate's attributes should not be updated. Post a new one

// Delete a DailyScheduleTemplate by id
router.delete("/:id", [authenticate], generalcontroller.delete(DailyScheduleTemplateModel));


export default router;

