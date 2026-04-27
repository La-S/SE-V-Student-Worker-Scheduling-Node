import db from "../models/index.ts";
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { NotFoundError } from "../error/notfound.error.ts";
import { AppError } from "../error/app.error.ts";
import { getStringFromDate, getOneForId, toHours } from "../services/services.ts";
const { Shift, TaskList, User, Position, TaskCompletion, Task, Employee } = db;
import type { ShiftType } from "../types/shift.type.ts";
import { getUserExpectedHoursForWeek } from "./user.controller.ts";
import { sendNotificationToEmployee } from "../services/notifications.ts";
import DropRequest from "../models/droprequest.model.ts";
import CoverRequest from "../models/coverrequest.model.ts";
import Timeclock from "../models/timeclock.model.ts";


const exports: any = {};
const errorClassName: string = "Shift";

// Create and Save a new Shift
exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    // Save Shift in the database
    let employee: Employee = await getOneForId(Employee, req.body.employeeId);
    let user: User = await getOneForId(User, employee.dataValues.userId);
    if (req.body.published === true && req.body.employeeId) {
        // don't wait for this response.
        sendNotificationToEmployee(req.body.employeeId, "New Shift", "A new shift has now become published.");
    }
    const hoursWorkedForUser: number = await getUserExpectedHoursForWeek(employee.dataValues.userId, req.body.date);
    const hoursForShift: number = toHours(req.body.endTime) - toHours(req.body.startTime);
    if (user.dataValues.isStudent && hoursWorkedForUser + hoursForShift > 20) {
        throw new AppError(403, `The employee is scheduled for ${hoursWorkedForUser} hours this week across all their jobs. This shift would put the employee over 20 hours for the week.`);
    }
    const data: Shift = await Shift.create(req.body);
    res.send(data);
};

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);

    const data: Shift = await getShiftForId(id);
    res.send(data);
};

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);

    //throws error if not found
    let originalShift: Shift = await getOneForId(Shift, id);
    let isPublishedOriginally: boolean = originalShift.published;
    let originalEmployeeId: number = originalShift.employeeId;
    let originalStartTime: string = originalShift.startTime;
    let originalEndTime: string = originalShift.endTime;
    let originalDate: string = originalShift.date;

    let employeeId: number = req.body.employeeId ?? originalShift.employeeId;
    let employee: Employee = await getOneForId(Employee, employeeId);
    let user: User = await getOneForId(User, employee.dataValues.userId);
    let hoursWorkedForUser: number = await getUserExpectedHoursForWeek(employee.dataValues.userId, req.body.date ?? originalShift.date);
    const oldShiftHours: number = toHours(originalEndTime) - toHours(originalStartTime);
    hoursWorkedForUser = hoursWorkedForUser - oldShiftHours;
    const newShiftHours: number = toHours(req.body.endTime ?? originalEndTime) - toHours(req.body.startTime ?? originalStartTime);
    hoursWorkedForUser = hoursWorkedForUser + newShiftHours;
    if (hoursWorkedForUser > 20 && user.dataValues.isStudent) {
        throw new AppError(403, `The employee is scheduled for ${hoursWorkedForUser} hours this week across all their jobs. This shift would put the employee over 20 hours for the week.`);
    }

    req.body.id = undefined;
    const numUpdated: number[] = await Shift.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(400, `Update Shift for id ${id} did not update. Check request body.`);
    }

    if ((req.body.published === true && isPublishedOriginally === false && employeeId)) {
        // don't wait for this response.
        sendNotificationToEmployee(employeeId, "New Shift", "A new shift has now become published.");
    } else if (req.body.employeeId !== originalEmployeeId) {
        sendNotificationToEmployee(employeeId, "New Shift", "A shift has been assigned to you.");
    } else if (req.body.date !== originalDate || req.body.startTime !== originalStartTime || req.body.endTime !== originalEndTime) {
        sendNotificationToEmployee(employeeId, "Shift Updated", "Your shift's time has been changed.");
    }
    let updatedObject: Shift = await getOneForId(Shift, id);

    res.send(updatedObject);
};





async function getShiftForId(id: number): Promise<Shift | null> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data: Shift | null = await Shift.findByPk(id, {
        include: [{
            model: Employee,
            include: [User]
        },
        {
            model: Position
        },
        {
            model: Timeclock
        },
        {
            model: TaskList,
            as: "taskList",
            include: [{
                model: Task,
                include: [{
                    model: TaskCompletion,
                    where: { shiftId: id },
                    required: false,
                    include: [
                        {
                            model: Employee,
                            include: [User]
                        }
                    ]
                }]
            }]
        },
        {
            model: DropRequest
        },
        {
            model: CoverRequest,
            include: [{ model: Employee, as: "coverAccepter", include: [User] }]
        }
        ]
    });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
};

exports.addTaskList = async (req: pkg.Request, res: pkg.Response) => {
    const shiftId: number = parseInt(req.params.id, 10);
    const taskListId: number = parseInt(req.params.tasklistid, 10);

    const shift: Shift | null = await Shift.findByPk(shiftId);
    if (!shift) {
        throw new NotFoundError(errorClassName, shiftId);
    }
    const taskList: TaskList | null = await TaskList.findByPk(taskListId);
    if (!taskList) {
        throw new NotFoundError("Task List", taskListId);
    }
    //@ts-ignore
    const data: any = await shift.addTaskList(taskList);
    if (!data) {
        res.status(400).send({ message: "Something went wrong adding task list" });
        return;
    }
    const tasks: Task[] = await taskList.getTasks();
    for (let task of tasks) {
        const taskCompletion: any = {
            "checkedOff": "false",
            "taskId": task.id,
            "shiftId": shift.dataValues.id
        }
        await TaskCompletion.create(taskCompletion);
    }
    res.send({ message: "Task List added successfully" });

}


exports.removeTaskList = async (req: pkg.Request, res: pkg.Response) => {
    const shiftId: number = parseInt(req.params.id, 10);
    const taskListId: number = parseInt(req.params.tasklistid, 10);

    const shift: Shift | null = await Shift.findByPk(shiftId);
    if (!shift) {
        throw new NotFoundError(errorClassName, shiftId);
    }
    const taskList: TaskList | null = await TaskList.findByPk(taskListId);
    if (!taskList) {
        throw new NotFoundError("Task List", taskListId);
    }
    //@ts-ignore
    const data: number = await shift.removeTaskList(taskList);
    if (data != 1) {
        res.status(400).send("Something went wrong removing task list")
    }
    else {
        res.send({ message: "Task List removed successfully" });
    }
}


export async function deleteShiftsForWeek(startDate: Date, businessUnitId: number) {
    const endDate: Date = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const endDateFormatted: string = getStringFromDate(endDate);
    const startDateFormatted: string = getStringFromDate(startDate);

    await Shift.destroy({
        where: {
            businessUnitId: businessUnitId,
            date: { [Op.between]: [startDateFormatted, endDateFormatted] }
        }
    });
}

export default exports;
