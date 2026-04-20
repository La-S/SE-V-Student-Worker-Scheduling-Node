import { Model } from "sequelize";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import DropRequest from "../models/droprequest.model.ts";
import Employee from "../models/employee.model.ts";
import pkg from 'express';
import User from "../models/user.model.ts";
import { getOneForId } from "../services/services.ts";
import Shift from "../models/shift.model.ts";
import { sendNotificationToEmployee, sendNotificationToManagers } from "../services/notifications.ts";
import { logger } from "../logger/logger.ts";

const errorClassName: string = "Drop Request";
const exports: any = {};

const EMPLOYEE_INCLUDES = [
    { model: Employee, as: "dropRequester", include: [User] },
    { model: Employee, as: "dropReviewer", include: [User] },
];


// Create and Save a new DropRequest
exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const data = await DropRequest.create(req.body);

    // send notification to managers.
    if (req.body.requesterId) {
        const employee = await Employee.findByPk(req.body.requesterId, {include: [User]});
        const businessUnitId = employee?.dataValues.businessUnitId;
        const firstName = employee?.dataValues.user.firstName;
        const lastName = employee?.dataValues.user?.lastName ?? "";
        if (businessUnitId) {
            sendNotificationToManagers(businessUnitId, "New Drop Request", `${firstName} ${lastName} wants to drop an upcoming shift.`);
        } else {
            logger.log('warn', `No businessUnit Id for employee ${req.body.requesterId}...`)
        }
    }
    res.send(data);
};

// Retrieve all DropRequests from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

    const data = await DropRequest.findAll({ include: EMPLOYEE_INCLUDES })
    res.send(data);
};

// Find a single DropRequest with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data = await getDropRequestForId(id);
    res.send(data);
};

// Update a DropRequest by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getDropRequestForId(id);
    
    req.body.requesterId = undefined;
    req.body.shiftId = undefined;
    req.body.id = undefined;

    const numUpdated = await DropRequest.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedRequest = await getDropRequestForId(id);
    res.send(updatedRequest);
};

exports.approveDropRequest = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const approverId = parseInt(req.params.approverId as string, 10);
    const approve: Boolean = req.query.approve === "true"; //converts to boolean
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const dropRequest = await getOneForId(DropRequest, id);

    if (approve == true) {
        const shift = await getOneForId(Shift, dropRequest.dataValues.shiftId);
        await shift.update({ employeeId: null});
    }

    await dropRequest.update({
        approval: approve,
        reviewedBy: approverId,
        reviewedDate: today,
        reviewedTime: currentTime
    });

    sendNotificationToEmployee(dropRequest.dataValues.requesterId, `Drop Request ${approve ? "Approved" : "Denied"}`, `A manager has reviewed and ${approve ? "approved" : "denied"} your drop request`);
    res.send(dropRequest);
}

//cannot be replaced with service because of Employee Returns
async function getDropRequestForId(id: number): Promise<Model<any, any> | null> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data = await DropRequest.findByPk(id, { include: EMPLOYEE_INCLUDES });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}
export default exports;
