import db from "../models/index.ts";
const Employee = db.Employee;
import { Model, Op } from 'sequelize';
import { type Request, type Response } from 'express';
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import WeeklyScheduleTemplate, { type WeeklyScheduleTemplateType } from "../models/weeklyscheduletemplate.model.ts";
import { createDateFromString, getOneForId, getStringFromDate, isSunday } from "../services/services.ts";
import Shift, { type ShiftType } from "../models/shift.model.ts";
import User from "../models/user.model.ts";
import Position from "../models/position.model.ts";
import DailyScheduleTemplate, { type DailyScheduleTemplateType } from "../models/dailyscheduletemplate.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";
import { deleteShiftsForWeek } from "./shift.controller.ts";
import TaskCompletion from "../models/taskcompletion.model.ts";
import { type TaskType } from "../models/task.model.ts";
import { type TaskListType } from "../models/tasklist.model.ts";

const errorClassName: string = "Weekly Schedule Template";

// Find a single User with an id
export async function findOne(req: Request, res: Response) {
    const id: number = parseInt(req.params.id, 10);

    const data: WeeklyScheduleTemplateType | null = await WeeklyScheduleTemplate.findByPk(id,
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
}

// Update a Employee by the id in the request
export async function update(req: Request, res: Response) {
    const id: number = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(WeeklyScheduleTemplate, id);

    //No reason it should change to a different business
    req.body.businessUnitId = undefined;
    req.body.id = undefined;

    const numUpdated: number[] = await WeeklyScheduleTemplate.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedWeeklySchedule: WeeklyScheduleTemplateType = await getOneForId(WeeklyScheduleTemplate, id);
    res.send(updatedWeeklySchedule);
}

export async function createFromShifts(req: Request, res: Response) {
    const businessUnitId: number = req.body.businessUnitId;
    await getOneForId(BusinessUnit, businessUnitId);
    const startDate: string = req.body.startDate;
    const name: string = req.body.name;

    const shiftsForWeek: Model<any, any>[][] = []
    let currentDay: Date = createDateFromString(startDate);
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
        const dailyScheduleTemplate: DailyScheduleTemplateType = await DailyScheduleTemplate.create(dailyScheduleTemplateBody);
        const dailyScheduleTemplateId: number = dailyScheduleTemplate.dataValues.id;

        const shiftsForDay: ShiftType[] = await Shift.findAll({
            where: {
                businessUnitId: businessUnitId,
                date: dateFormatted
            }
        });
        //maintain startTime, endTime, businessUnitId, employeeId, positionId
        shiftsForDay.forEach(async (shift: ShiftType) => {
            const shiftValues: any = { ...shift.dataValues };
            shiftValues.id = undefined;
            shiftValues.date = null;
            shiftValues.dailyScheduleTemplateId = dailyScheduleTemplateId;
            shiftValues.createdAt = undefined;
            shiftValues.updatedAt = undefined;
            shiftValues.published = false;
            const newShift = await Shift.create(shiftValues);
            //despite the name it returns multiple. Sequelize-made, cannot change
            //@ts-ignore
            const taskLists = await shift.getTaskList();
            copyTaskListsToNewShift(taskLists, newShift);
        })
        //increment day by one, full week
        currentDay.setDate(currentDay.getDate() + 1);
    };
    res.send(weeklyScheduleTemplate);

}

export async function loadShifts(req: Request, res: Response) {

    //get weekly schedule, get daily schedules. First day is Sunday.
    //duplicate shifts from daily schedule to currentDate, change date. 
    // Duplicate shifts-tasklists
    const id: number = req.body.id;
    const weeklyScheduleTemplate: WeeklyScheduleTemplateType = await getOneForId(WeeklyScheduleTemplate, id);
    //HAS TO BE A SUNDAY!
    const startDate: string = req.body.startDate;
    let currentDate: Date = createDateFromString(startDate);
    if (!isSunday(currentDate)) {
        throw new AppError(400, "startDate must be a Sunday")
    }
    const deleteShifts: boolean = req.body.delete;
    const businessUnitId: number = req.body.businessUnitId;
    await getOneForId(BusinessUnit, businessUnitId);
    if (deleteShifts) {
        deleteShiftsForWeek(currentDate, businessUnitId)
    }

    //sunday-sat
    for (const dayOfWeek of daysOfWeek) {
        const shiftsForDay: ShiftType[] = await getShiftsFromDailyScheduleTemplate(id, dayOfWeek);
        shiftsForDay.forEach(async (shift: ShiftType) => {
            const shiftValues: any = { ...shift.dataValues };
            shiftValues.id = undefined;
            shiftValues.date = getStringFromDate(currentDate);
            shiftValues.dailyScheduleTemplateId = null;
            const newShift: ShiftType = await Shift.create(shiftValues);
            //despite the name it returns multiple. Sequelize-made, cannot change
            //@ts-ignore
            const taskLists: TaskListType[] = await shift.getTaskList();
            copyTaskListsToNewShift(taskLists, newShift);
            makeTaskCompletionsForNewShift(taskLists, newShift);
        })
        currentDate.setDate(currentDate.getDate() + 1);
    }
    res.send({ message: "shifts created" });
}

async function copyTaskListsToNewShift(taskLists: TaskListType[], shift: ShiftType) {
    taskLists.forEach((taskList) => {
        //@ts-ignore
        taskList.addShift(shift);
    })
}

async function makeTaskCompletionsForNewShift(taskLists: TaskListType[], shift: ShiftType) {
    taskLists.forEach(async (taskList) => {
        //@ts-ignore
        const tasks: TaskType[] = await taskList.getTasks();
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

async function getShiftsFromDailyScheduleTemplate(weeklyScheduleTemplateId: number, dayOfWeek: string) {
    const dailyScheduleTemplate: DailyScheduleTemplateType | null = await DailyScheduleTemplate.findOne({
        where: {
            weeklyScheduleTemplateId: weeklyScheduleTemplateId,
            dayOfWeek: dayOfWeek
        }
    });
    if (!dailyScheduleTemplate) {
        throw new AppError(400, `DailyScheduleTemplate not found for weekly schedule template with id ${weeklyScheduleTemplateId}`)
    }
    //@ts-ignore
    const shifts: ShiftType[] = await dailyScheduleTemplate.getShifts();
    return shifts;
}

