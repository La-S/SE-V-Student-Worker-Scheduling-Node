import pkg from 'express'
import Shift from "../models/shift.model.ts"
import BusinessUnit from '../models/businessunit.model.ts';
import { Model, Op } from 'sequelize';
import Employee from '../models/employee.model';
import User from '../models/user.model.ts';
import Position from '../models/position.model';
const exports: any = {}

exports.findShifts = async (req: pkg.Request, res: pkg.Response) => {

    const id = parseInt(req.params.id, 10);
    const startDate = req.query.start;
    const endDate = req.query.end;
    let data = {};
    let query = {};

    //no dates, get all
    if (!startDate && !endDate) {
        data = Shift.findAll({
            where: { businessUnitId: id },
            include: [{
                model: Employee,
                include: [User]
            },
            {
                model: Position
            }
            ]
        });
    }
    //no start, get all up to end date
    else if (!startDate) {
        data = Shift.findAll({
            where: {
                businessUnitId: id,
                date: {
                    [Op.lte]: endDate
                }
            },
            include: [{
                model: Employee,
                include: [User]
            },
            {
                model: Position
            }
            ]
        });
    }
    //no end, get all shifts after date
    else if (!endDate) {
        data = Shift.findAll({
            where: {
                businessUnitId: id,
                date: {
                    [Op.gte]: startDate
                }
            },
            include: [{
                model: Employee,
                include: [User]
            },
            {
                model: Position
            }
            ]
        });
    }
    //start AND end date, get only within date range
    else {
        data = Shift.findAll({
            where: {
                businessUnitId: id,
                date: {
                    [Op.between]: startDate
                }
            },
            include: [{
                model: Employee,
                include: [User]
            },
            {
                model: Position
            }
            ]
        });
    }
    res.send(data);
};

export default exports;