import { Model } from "sequelize";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import CoverRequest from "../models/coverrequest.model.ts";
import Employee from "../models/employee.model.ts";
import pkg from 'express';
import User from "../models/user.model.ts";

const errorClassName: string = "Cover Request";
const exports: any = {};

const EMPLOYEE_INCLUDES = [
    { model: Employee, as: "requester", include: [User] },
    { model: Employee, as: "accepter", include: [User] },
    { model: Employee, as: "reviewer", include: [User] },
];


// Retrieve all Employees from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

    const data = await CoverRequest.findAll({ include: EMPLOYEE_INCLUDES })
    res.send(data);
};

// Find a single User with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data = await getCoverRequestForId(id);
    res.send(data);
};

// Update a CoverRequest by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getCoverRequestForId(id);

    //an employee should refer to a userId and businessUnitId, these should not change
    req.body.requesterId = undefined;
    req.body.shiftId = undefined;
    req.body.id = undefined;

    const numUpdated = await CoverRequest.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedEmployee = await getCoverRequestForId(id);
    res.send(updatedEmployee);
};


//cannot be replaced with service because of user in return
async function getCoverRequestForId(id: number): Promise<Model<any, any> | null> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data = await CoverRequest.findByPk(id, { include: EMPLOYEE_INCLUDES });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}
export default exports;