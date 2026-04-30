import db from "../models/index.ts";
const TaskList = db.TaskList;
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import Shift, { type ShiftType } from "../models/shift.model.ts"
import Timeclock, { type TimeclockType } from "../models/timeclock.model.ts";
import { Model } from "sequelize";
import { NotFoundError } from "../error/notfound.error.ts";
import { type EmployeeType } from "../models/employee.model.ts";
import { type UserType } from "../models/user.model.ts";

const exports: any = {};

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    await getOneForId(Shift, req.body.shiftId);
    const data: TimeclockType = await Timeclock.create(req.body);
    res.send(data);
}

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    req.body.id = undefined;
    req.body.shiftId = undefined;
    await Timeclock.update(req.body, { where: { id: id } });
    const updatedTimeClock: TimeclockType = await getOneForId(Timeclock, id);
    res.send(updatedTimeClock);
}

exports.clockIn = async (req: pkg.Request, res: pkg.Response) => {
    const shiftId: number = parseInt(req.params.shiftId, 10);
    const shift: ShiftType = await getOneForId(Shift, shiftId);
    //@ts-ignore
    const employee: EmployeeType = await shift.getEmployee();
    if (!employee){
        throw new AppError(400, "Shift is not assigned to anyone, cannot clock in.")
    }
    //@ts-ignore
    const user: UserType = await employee.getUser();
    const ocId: string = user.dataValues.ocId;
    if (ocId) {
        if (req.params.password != ocId) {
            throw new AppError(401, "Invalid password entered")
        }
    }

    const timeclocks: TimeclockType[] = await Timeclock.findAll({ where: { shiftId: shiftId }, order: [["clockIn", "desc"], ["id", "desc"]] });
    const currentClockIn: TimeclockType = timeclocks[0];
    if (timeclocks.length > 0 && currentClockIn.dataValues.clockOut === null) {
        throw new AppError(400, "The previous timeclock for this shift must be clocked out first.")
    }
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    const createBody = {
        "shiftId": shiftId,
        "clockIn": currentTime
    }

    const data: TimeclockType = await Timeclock.create(createBody);
    res.send(data);
};

exports.clockOut = async (req: pkg.Request, res: pkg.Response) => {
    const shiftId: number = parseInt(req.params.shiftId, 10);
    await getOneForId(Shift, shiftId);
    //sort by the clockIn time, most recent first
    const timeclocks: TimeclockType[] = await Timeclock.findAll({ where: { shiftId: shiftId }, order: [["clockIn", "desc"], ["id", "desc"]] });
    //last timeclock is the one we want to clock out for
    const currentClockIn: TimeclockType = timeclocks[0];
    if (!currentClockIn) {
        throw new AppError(404, "No clock-ins found for shift.")
    }
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    const clockOut = { "clockOut": currentTime };
    const data: TimeclockType = await currentClockIn.update(clockOut);
    const updatedTimeClock: TimeclockType | null = await Timeclock.findOne({ where: { id: currentClockIn.dataValues.id } });
    res.send(updatedTimeClock);
}

export default exports;