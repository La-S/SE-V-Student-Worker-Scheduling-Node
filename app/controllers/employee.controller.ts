import db from "../models/index.ts";
const Employee = db.Employee;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import type { EmployeeType } from "../types/employee.type.ts";
import User from "../models/user.model.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import { AppError } from "../error/app.error.ts";
import Shift from "../models/shift.model.ts";
import Position from "../models/position.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import { getOneForId } from "../services/services.ts";
import AvailabilityTemplate from "../models/availabilitytemplate.model.ts";

const exports: any = {};
const errorClassName = "Employee";

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const existingEmployee = await Employee.findOne({
        where: {
            userId: req.body.userId,
            businessUnitId: req.body.businessUnitId
        }
    });
    if (existingEmployee) {
        throw new AppError(409, `Employee for user ${req.body.userId} already exists at business ${req.body.businessUnitId}`)
    }
    const data = await Employee.create(req.body)
    res.send(data);
}

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

exports.findShifts = async (req: pkg.Request, res: pkg.Response) => {

    const id = parseInt(req.params.id, 10);
    const startDate = req.query.start;
    const endDate = req.query.end;
    let dateCondition = {}
    //no startDate, get all up to end
    if (!startDate && !endDate){
        dateCondition = {
            [Op.gt]: '1000-01-01'
        }
    }
    else if (!startDate) {
        dateCondition =
        {
            [Op.lte]: endDate
        }
    }
    //no end date, get all after start
    else if (!endDate) {
        dateCondition = {
            [Op.gte]: startDate
        }
    }
    //both dates, get between them
    else {
        dateCondition = {
            [Op.between]: [startDate, endDate]
        }
    }
    const data = await Shift.findAll({
        where: {
            employeeId: id,
            date: dateCondition
        }, include: [Position, BusinessUnit]
    });
    res.send(data);
}

exports.findAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee = await getOneForId(Employee, id);
    console.log(Object.getOwnPropertyNames(employee.__proto__));

    //@ts-ignore
    const userId = employee.userId

    const data = await AvailabilityTemplate.findAll({ where: { userId: userId } });
    res.send(data);
}

exports.addPosition = async (req: pkg.Request, res: pkg.Response) => {
    const employeeId = parseInt(req.params.id, 10);
    const positionId = parseInt(req.params.positionid, 10)

    if (!employeeId || !positionId) {
        throw new AppError(400, "one of the entered ids is not a number")
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
        throw new NotFoundError(errorClassName, employeeId);
    }
    const position = await Position.findByPk(positionId);
    if (!position) {
        throw new NotFoundError("Position", positionId);
    }
    //@ts-ignore
    const data = await employee.addPosition(position);
    if (!data) {
        res.status(400).send({ message: "Something went wrong adding position" })
    }
    else {
        res.send({ message: "Position added successfully" });
    }
}


exports.removePosition = async (req: pkg.Request, res: pkg.Response) => {
    const employeeId = parseInt(req.params.id, 10);
    const positionId = parseInt(req.params.positionid, 10)

    if (!employeeId || !positionId) {
        throw new AppError(400, "one of the entered ids is not a number")
    }

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
        throw new NotFoundError(errorClassName, employeeId);
    }
    const position = await Position.findByPk(positionId);
    if (!position) {
        throw new NotFoundError("Position", positionId);
    }
    //@ts-ignore
    const data = await employee.removePosition(position);
    if (!data) {
        res.status(400).send({ message: "Something went wrong adding position" })
    }
    else {
        res.send({ message: "Position added successfully" });
    }
}

exports.findPositions = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee = await getOneForId(Employee, id);
    //@ts-ignore
    const data = await employee.getPositions()
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
