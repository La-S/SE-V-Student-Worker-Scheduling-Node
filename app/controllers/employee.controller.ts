import db from "../models/index.ts";
const Employee = db.Employee;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import type { EmployeeType } from "../types/employee.type.ts";
import User from "../models/user.model.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import { AppError } from "../error/app.error.ts";

const exports: any = {};
const errorClassName = "Business Unit";

// Create and Save a new Employee
exports.create = async (req: pkg.Request, res: pkg.Response) => {

    const employee: EmployeeType = {
        id: undefined,
        userId: req.body.userId,
        businessUnitId: req.body.businessUnitId,
        semester: req.body.semester,
        currentlyEmployed: req.body.currentlyEmployed ?? true,
        maxWeeklyHours: req.body.maxWeeklyHours ?? 20,
        minWeeklyHours: req.body.minWeeklyHours ?? 0,
        isManager: false
    };

    // Save User in the database
    const data = await Employee.create(employee as any)
    res.send(data);
};

// Retrieve all Employees from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

    const data = await Employee.findAll({ include: [User] })
    res.send(data);
};

// Find a single User with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data = await getEmployeeForId(id, res);
    res.send(data);
};

// Update a Employee by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getEmployeeForId(id, res);

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
    let updatedEmployee = await getEmployeeForId(id, res);
    res.send(updatedEmployee);
};

// Delete a Employee with the specified id in the request
exports.delete = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getEmployeeForId(id, res);

    const numDeleted = await Employee.destroy({
        where: { id: id },
    })
    if (numDeleted <= 0) {
        throw new AppError(409, `Delete for id ${id} did not delete. Check request body.`)
    }
    res.status(200).send({ message: "Employee deleted successfully!" });

};

async function getEmployeeForId(id: number, res: pkg.Response): Promise<Model<any, any> | null> {
    const data = await Employee.findByPk(id, { include: [User] });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}
export default exports;
