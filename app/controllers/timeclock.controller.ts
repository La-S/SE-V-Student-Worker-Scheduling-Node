import db from "../models/index.ts";
const TaskList = db.TaskList;
import { type Request, type Response } from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import Shift from "../models/shift.model.ts"
import Timeclock from "../models/timeclock.model.ts";
import { Model } from "sequelize";
import { NotFoundError } from "../error/notfound.error.ts";


export async function create(req: Request, res: Response) {
    req.body.id = undefined;
    await getOneForId(Shift, req.body.shiftId);
    const data: Model = await Timeclock.create(req.body);
    res.send(data);
}

export async function update(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    req.body.id = undefined;
    req.body.shiftId = undefined;
    await Timeclock.update(req.body, { where: { id: id } });
    const updatedTimeClock: Model = await getOneForId(Timeclock, id);
    res.send(updatedTimeClock);
}

export async function clockIn(req: Request, res: Response) {
    const shiftId: number = parseInt(req.params.shiftId, 10);
    const shift: Model = await getOneForId(Shift, shiftId);
    const employee: Model = await shift.getEmployee();
    if (!employee){
        throw new AppError(400, "Shift is not assigned to anyone, cannot clock in.")
    }
    const user: Model = await employee.getUser();
    const ocId: string = user.dataValues.ocId;
    if (ocId) {
        if (req.params.password != ocId) {
            throw new AppError(401, "Invalid password entered")
        }
    }

    const timeclocks: Model[] = await Timeclock.findAll({ where: { shiftId: shiftId }, order: [["clockIn", "desc"], ["id", "desc"]] });
    const currentClockIn: Model = timeclocks[0];
    if (timeclocks.length > 0 && currentClockIn.dataValues.clockOut === null) {
        throw new AppError(400, "The previous timeclock for this shift must be clocked out first.")
    }
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    const createBody = {
        "shiftId": shiftId,
        "clockIn": currentTime
    }

    const data = await Timeclock.create(createBody);
    res.send(data);
}

export async function clockOut(req: Request, res: Response) {
    const shiftId: number = parseInt(req.params.shiftId, 10);
    await getOneForId(Shift, shiftId);
    //sort by the clockIn time, most recent first
    const timeclocks: Model[] = await Timeclock.findAll({ where: { shiftId: shiftId }, order: [["clockIn", "desc"], ["id", "desc"]] });
    //last timeclock is the one we want to clock out for
    const currentClockIn: Model = timeclocks[0];
    if (!currentClockIn) {
        throw new AppError(404, "No clock-ins found for shift.")
    }
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    const clockOut = { "clockOut": currentTime };
    const data: number = await currentClockIn.update(clockOut);
    const updatedTimeClock: Model | null = await Timeclock.findOne({ where: { id: currentClockIn.dataValues.id } });
    res.send(updatedTimeClock);
}

