import db from "../models/index.ts";
const Employee = db.Employee;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import WeeklyScheduleTemplate from "../models/weeklyscheduletemplate.model.ts";
import { getOneForId } from "../services/services.ts";
import Shift from "../models/shift.model.ts";
import User from "../models/user.model.ts";
import Position from "../models/position.model.ts";
import DailyScheduleTemplate from "../models/dailyscheduletemplate.model.ts";

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

    throw new AppError(404, "Route not allowed")
    //TODO - implement
}

export default exports;
