import db from "../models/index.ts";
const TaskList = db.TaskList;
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import Shift from "../models/shift.model.ts"
import Timeclock from "../models/timeclock.model.ts";
import { Model } from "sequelize";
import { NotFoundError } from "../error/notfound.error.ts";

const exports: any = {};


exports.clockIn = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.shiftId, 10);
    const shift: Model = await getOneForId(Shift, id);
    const employee: Model = await shift.getEmployee();
    const user: Model = await employee.getUser();
    const ocId: number = user.dataValues.ocId;
    if (user.dataValues.ocId){
        if (req.body.password != user.dataValues.ocId){
            throw new AppError(401, "Invalid password entered/")
        }
    }
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    req.body.clockIn = currentTime;


    const data = await Timeclock.create(req.body);
    res.send(data);
};

exports.clockOut = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.shiftId, 10);
    await getOneForId(Shift, id);
    //sort by the clockIn time, most recent first
    const timeclocks = await Timeclock.findAll({where: {shiftId: id}, order:[["clockIn", "desc"]]});
    //last timeclock is the one we want to clock out for
    const currentClockIn = timeclocks[0];
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    const clockOut = {"clockOut": currentTime};
    const data = currentClockIn.update(clockOut);
    const updatedTimeClock = await Timeclock.findOne({where: {id: currentClockIn.dataValues.id}});
    res.send(updatedTimeClock);
}

async function getTaskListForId(id: number): Promise<Model<any, any> | null> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data = await TaskList.findByPk(id, { include: [Task] });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}

export default exports;