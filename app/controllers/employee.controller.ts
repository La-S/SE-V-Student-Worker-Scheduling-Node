import db from "../models/index.ts";
const Employee = db.Employee;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import User from "../models/user.model.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import { AppError } from "../error/app.error.ts";
import Position from "../models/position.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import Shift from "../models/shift.model.ts";

const exports: any = {};
const errorClassName = "Employee";


// Retrieve all Employees from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

    const data = await Employee.findAll({ include: [User] })
    res.send(data);
};

// Find a single User with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data = await getEmployeeForId(id);
    res.send(data);
};

// Update a Employee by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getEmployeeForId(id);

    //an employee should refer to a userId and businessUnitId, these should not change
    req.body.userId = undefined;
    req.body.businessUnitId = undefined;
    req.body.id = undefined;

    const numUpdated = await Employee.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedEmployee = await getEmployeeForId(id);
    res.send(updatedEmployee);
};

exports.getShiftsForEmployee = async (req: pkg.Request, res: pkg.Response) => {

    const id = parseInt(req.params.id, 10);
    const startDate = req.query.start;
    const endDate = req.query.end;
    let data = {};
    let includeCondition = [Position, BusinessUnit]
    let whereCondition = {}
    //no date range, get all
    if (!startDate && !endDate) {
        whereCondition = {
            employeeId: id
        }
    }
    //no startDate, get all up to end
    else if (!startDate) {
        whereCondition = {
            employeeId: id,
            date: {
                [Op.lte]: endDate
            }
        }
    }
    //no end date, get all after start
    else if (!endDate) {
        whereCondition = {
            employeeId: id,
            date: {
                [Op.gte]: startDate
            }
        }
    }
    //both dates, get between them
    else {
        whereCondition = {
            employeeId: id,
            date: {
                [Op.between]: [startDate, endDate]
            }
        }
    }
    data = await Shift.findAll({ where: whereCondition, include: includeCondition });
    res.send(data);
}

//cannot be replaced with service because of user in return
async function getEmployeeForId(id: number): Promise<Model<any, any> | null> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data = await Employee.findByPk(id, { include: [User] });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}
export default exports;
