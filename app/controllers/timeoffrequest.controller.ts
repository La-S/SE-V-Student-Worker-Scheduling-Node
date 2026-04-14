import { Model, Op } from "sequelize";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import TimeOffRequest from "../models/timeoffrequest.model.ts";
import Employee from "../models/employee.model.ts";
import pkg from 'express';
import User from "../models/user.model.ts";
import { getOneForId } from "../services/services.ts";
import { sendNotificationToEmployee, sendNotificationToManagers } from "../services/notifications.ts";
import Shift from "../models/shift.model.ts";

const errorClassName: string = "Time Off Request";
const exports: any = {};

const EMPLOYEE_INCLUDES = [
    { model: Employee, as: "requester", include: [User] },
    { model: Employee, as: "reviewer", include: [User] },
];


// Create and Save a new TimeOffRequest
exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const requesterId: number = parseInt(req.body.requesterId);
    if (!requesterId) {
        throw new AppError(400, "request must have a requesterId");
    }
    const employee = await Employee.findByPk(req.body.requesterId, { include: [User] });
    if (!employee) {
        throw new NotFoundError("Employee", requesterId);
    }
    const startDate: string = req.body.startDate;
    const endDate: string = req.body.endDate;
    if (!startDate || !endDate) {
        throw new AppError(400, "request must have a startDate and endDate.");
    }
    if (endDate < startDate) {
        throw new AppError(400, "endDate must be the same day or after startDate.")
    }
    const data = await TimeOffRequest.create(req.body);

    // send notification to managers.
    const businessUnitId = employee.dataValues.businessUnitId;
    const firstName = employee.dataValues.user.firstName;
    const lastName = employee.dataValues.user.lastName ?? "";
    if (businessUnitId) {
        sendNotificationToManagers(businessUnitId, "New Time Off Request", `${firstName} ${lastName} has submitted a time off request.`);
    } else {
        console.warn(`No businessUnit Id for employee ${req.body.requesterId}...`);
    }
    res.send(data);
};

// Retrieve all TimeOffRequests from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {
    const data = await TimeOffRequest.findAll({ include: EMPLOYEE_INCLUDES });
    res.send(data);
};

// Find a single TimeOffRequest with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data = await getTimeOffRequestWithShifts(id);
    res.send(data);
};

// Update a TimeOffRequest by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    // throws error if not found
    await getOneForId(TimeOffRequest, id);

    req.body.requesterId = undefined;
    req.body.id = undefined;

    const numUpdated = await TimeOffRequest.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`);
    }
    const updatedRequest = await getTimeOffRequestWithShifts(id);
    res.send(updatedRequest);
};

// Approve or Deny a TimeOffRequest
exports.approveTimeOffRequest = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const approverId = parseInt(req.params.approverId as string, 10);
    const approve: Boolean = req.query.approve === "true"; // converts to boolean
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const timeOffRequest = await getOneForId(TimeOffRequest, id);

    await timeOffRequest.update({
        approval: approve,
        reviewedBy: approverId,
        reviewedDate: today,
        reviewedTime: currentTime
    });

    sendNotificationToEmployee(
        timeOffRequest.dataValues.requesterId,
        `Time Off Request ${approve ? "Approved" : "Denied"}`,
        `A manager has reviewed and ${approve ? "approved" : "denied"} your time off request.`
    );
    res.send(timeOffRequest);
};

// cannot be replaced with service because of Employee Returns
async function getTimeOffRequestWithShifts(id: number): Promise<Model<any, any> | null> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer");
    }
    const timeOffRequest = await TimeOffRequest.findByPk(id);
    if (!timeOffRequest) {
        throw new NotFoundError("Time Off Request", id);
    }
    const data = await TimeOffRequest.findByPk(id, {
        include: [...EMPLOYEE_INCLUDES,
        {
            model: Employee,
            include: [User,
                {
                    model: Shift,
                    where: {
                        date: { [Op.between]: [timeOffRequest.dataValues.startDate, timeOffRequest.dataValues.endDate] }
                    }
                }
            ]
        }
        ]
    });
    return data;
}

export default exports;