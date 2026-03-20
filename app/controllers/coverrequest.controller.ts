import { Model } from "sequelize";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import CoverRequest from "../models/coverrequest.model.ts";
import Employee from "../models/employee.model.ts";
import pkg from 'express';
import User from "../models/user.model.ts";
import { getOneForId } from "../services/services.ts";
import Shift from "../models/shift.model.ts";

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

exports.acceptCoverRequest = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const coverRequest = await getOneForId(CoverRequest, id);
    if (coverRequest!.dataValues.accepterId !== null) {
        throw new AppError(400, "This cover request has already been accepted.")
    }
    const employeeId = parseInt(req.params.employeeId as string, 10);
    await getOneForId(Employee, employeeId);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { hour12: false });

    await coverRequest.update({
        accepterId: employeeId,
        acceptDate: today,
        acceptTime: currentTime
    });
    res.send(coverRequest);
}

exports.approveCoverRequest = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const approverId = parseInt(req.params.approverId as string, 10);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { hour12: false });

    const coverRequest = await getOneForId(CoverRequest, id);
        if (coverRequest.dataValues.accepterId == null) {
        throw new AppError(400, "This cover request has not been accepted yet.")
    }
    const shift = await getOneForId(Shift, coverRequest.dataValues.shiftId)


    await shift.update({ employeeId: coverRequest!.dataValues.accepterId });
    await coverRequest.update({
        approval: true,
        reviewedBy: approverId,
        reviewedDate: today,
        reviewedTime: currentTime
    });
    res.send(coverRequest);
}

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