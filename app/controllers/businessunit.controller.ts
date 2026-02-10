import pkg from 'express'
import Shift from "../models/shift.model.ts"
import BusinessUnit from '../models/businessunit.model.ts';
import { Model, Op } from 'sequelize';
import Employee from '../models/employee.model.ts';
import User from '../models/user.model.ts';
import Position from '../models/position.model.ts';
const exports: any = {}

exports.findShifts = async (req: pkg.Request, res: pkg.Response) => {

    const id = parseInt(req.params.id, 10);
    const startDate = req.query.start;
    const endDate = req.query.end;
    let data = {};
    let includeCondition = [{
        model: Employee,
        include: [User]
    },
    {
        model: Position
    }]
    let whereCondition = {}
    //no date range, get all
    if (!startDate && !endDate) {
        whereCondition = {
            businessUnitId: id
        }
    }
    //no startDate, get all up to end
    else if (!startDate) {
        whereCondition = {
            businessUnitId: id,
            date: {
                [Op.lte]: endDate
            }
        }
    }
    //no end date, get all after start
    else if (!endDate) {
        whereCondition = {
            businessUnitId: id,
            date: {
                [Op.gte]: startDate
            }
        }
    }
    //both dates, get between them
    else {
        whereCondition = {
            businessUnitId: id,
            date: {
                [Op.between]: [startDate, endDate]
            }
        }
    }
    data = await Shift.findAll({where: whereCondition, include: includeCondition});
    res.send(data);
};

export default exports;