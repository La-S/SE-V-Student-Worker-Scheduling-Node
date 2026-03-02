import db from "../models/index.ts";
const Employee = db.Employee;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import WeeklyScheduleTemplate from "../models/weeklyscheduletemplate.model.ts";
import { getOneForId } from "../services/services.ts";
import Shift from "../models/shift.model.ts";
import User from "../models/user.model.ts";
import Position from "../models/position.model.ts";
import DailyScheduleTemplate from "../models/dailyscheduletemplate.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";
import { deleteShiftsForWeek } from "./shift.controller.ts";
import TaskCompletion from "../models/taskcompletion.model.ts";

const exports: any = {};
const errorClassName = "Weekly Schedule Template";

// Find a single User with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data = await WeeklyScheduleTemplate.findByPk(id,
        {
            include:
                [{
                    model: DailyScheduleTemplate,
                    include: [{
                        model: Shift,
                        include: [{
                            model: Employee,
                            include: [User]
                        },
                        {
                            model: Position
                        }]
                    },]
                }]
        });
    if (!data) {
        throw new NotFoundError("Weekly Schedule Template", id)
    }
    res.send(data);
};

// Update a Employee by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(WeeklyScheduleTemplate, id);

    //No reason it should change to a different business
    req.body.businessUnitId = undefined;
    req.body.id = undefined;

    const numUpdated = await WeeklyScheduleTemplate.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedWeeklySchedule = await getOneForId(WeeklyScheduleTemplate, id);
    res.send(updatedWeeklySchedule);
};

exports.createFromShifts = async (req: pkg.Request, res: pkg.Response) => {
    const businessUnitId: number = req.body.businessUnitId;
    await getOneForId(BusinessUnit, businessUnitId);
    const startDate: string = req.body.startDate;
    const name: String = req.body.name;

    const shiftsForWeek: Model<any, any>[][] = []
    let currentDay: Date = new Date(startDate + 'T00:00:00');
    if (!isSunday(currentDay)) {
        throw new AppError(400, "startDate must be a Sunday")
    }

    const weeklyScheduleBody = {
        "name": name,
        "businessUnitId": businessUnitId
    }
    const weeklyScheduleTemplate = await WeeklyScheduleTemplate.create(weeklyScheduleBody);
    const weeklyScheduleTemplateId = weeklyScheduleTemplate.dataValues.id

    for (let day = 0; day < 7; day++) {
        //formats to yyyy-mm-dd
        const dateFormatted = currentDay.toISOString().split('T')[0]
        const dayOfWeek = daysOfWeek[day];
        const dailyScheduleTemplateBody = {
            weeklyScheduleTemplateId: weeklyScheduleTemplateId,
            dayOfWeek: dayOfWeek
        }
        const dailyScheduleTemplate = await DailyScheduleTemplate.create(dailyScheduleTemplateBody);
        const dailyScheduleTemplateId = dailyScheduleTemplate.id;

        const shiftsForDay = await Shift.findAll({
            where: {
                businessUnitId: businessUnitId,
                date: dateFormatted
            }
        });
        //maintain startTime, endTime, businessUnitId, employeeId, positionId
        shiftsForDay.forEach(async (shift) => {
            const shiftValues = { ...shift.dataValues };
            shiftValues.id = undefined;
            shiftValues.date = null;
            shiftValues.dailyScheduleTemplateId = dailyScheduleTemplateId;
            shiftValues.createdAt = undefined;
            shiftValues.updatedAt = undefined;
            shiftValues.published = false;
            const newShift = await Shift.create(shiftValues);
            //despite the name it returns multiple. Sequelize-made, cannot change
            const taskLists = await shift.getTaskList();
            copyTaskListsToNewShift(taskLists, newShift);
        })
        //increment day by one, full week
        currentDay.setDate(currentDay.getDate() + 1);
    };
    res.send(weeklyScheduleTemplate);

};

exports.loadShifts = async (req: pkg.Request, res: pkg.Response) => {

    //get weekly schedule, get daily schedules. First day is Sunday.
    //duplicate shifts from daily schedule to currentDate, change date. 
    // Duplicate shifts-tasklists
    const id = req.body.id;
    const weeklyScheduleTemplate = await getOneForId(WeeklyScheduleTemplate, id);
    //HAS TO BE A SUNDAY!
    const startDate = req.body.startDate;
    let currentDate: Date = new Date(startDate + 'T00:00:00');
    if (!isSunday(currentDate)) {
        throw new AppError(400, "startDate must be a Sunday")
    }
    const deleteShifts: boolean = req.body.delete;
    const businessUnitId = req.body.businessUnitId;
    await getOneForId(BusinessUnit, businessUnitId);
    if (deleteShifts) {
        deleteShiftsForWeek(new Date(startDate), businessUnitId)
    }

    //sunday-sat
    for (let i = 1; i <= 7; i++) {
        const shiftsForDay = await getShiftsFromDailyScheduleTemplate(id, i);
        shiftsForDay.forEach(async (shift: Model<any, any>) => {
            const shiftValues = { ...shift.dataValues };
            shiftValues.id = undefined;
            shiftValues.date = currentDate.toLocaleDateString("en-CA");
            shiftValues.dailyScheduleTemplateId = null;
            const newShift = await Shift.create(shiftValues);
            //despite the name it returns multiple. Sequelize-made, cannot change
            const taskLists = await shift.getTaskList();
            copyTaskListsToNewShift(taskLists, newShift);
            makeTaskCompletionsForNewShift(taskLists, newShift);
        })
        currentDate.setDate(currentDate.getDate() + 1);
    }
    res.send({ message: "shifts created" });
}

async function copyTaskListsToNewShift(taskLists: Model<any, any>[], shift: Model<any, any>) {
    taskLists.forEach((taskList) => {
        taskList.addShift(shift);
    })
}

async function makeTaskCompletionsForNewShift(taskLists: Model<any, any>[], shift: Model<any, any>) {
    taskLists.forEach(async (taskList) => {
        const tasks = await taskList.getTasks();
        tasks.forEach((task) => {
            const taskId = task.dataValues.id;
            const taskCompletionBody = {
                "taskId": taskId,
                "shiftId": shift.dataValues.id,
            }
            TaskCompletion.create(taskCompletionBody);
        })
    })
}

async function getShiftsFromDailyScheduleTemplate(weeklyScheduleTemplateId: number, dayOfWeek: number) {
    const dailyScheduleTemplate: Model<any, any> | null = await DailyScheduleTemplate.findOne({
        where: {
            weeklyScheduleTemplateId: weeklyScheduleTemplateId,
            dayOfWeek: dayOfWeek
        }
    });
    if (!dailyScheduleTemplate) {
        throw new AppError(400, `DailyScheduleTemplate not found for weekly schedule template with id ${weeklyScheduleTemplateId}`)
    }
    const shifts = await dailyScheduleTemplate.getShifts();
    return shifts;
}
export default exports;

function isSunday(date: Date) {
    const dayOfWeek = date.getDay();
    return (dayOfWeek == 0)
}
