import { Model, Op } from "sequelize";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import TimeOffRequest, { type TimeOffRequestType } from "../models/timeoffrequest.model.ts";
import Employee, { type EmployeeType } from "../models/employee.model.ts";
import { type Request, type Response } from 'express';
import User from "../models/user.model.ts";
import { getOneForId } from "../services/services.ts";
import { sendNotificationToEmployee, sendNotificationToManagers } from "../services/notifications.ts";
import Shift, { type ShiftType } from "../models/shift.model.ts";
import { getShiftsForDateRange } from "./employee.controller.ts";
import { logger } from "../logger/logger.ts";

const errorClassName: string = "Time Off Request";

const EMPLOYEE_INCLUDES = [
    { model: Employee, as: "timeOffRequester", include: [User] },
    { model: Employee, as: "timeOffReviewer", include: [User] },
];


// Create and Save a new TimeOffRequest
export async function create(req: Request, res: Response) {
    req.body.id = undefined;
    const requesterId: number = parseInt(req.body.requesterId);
    if (!requesterId) {
        throw new AppError(400, "request must have a requesterId");
    }
    const employee: EmployeeType | null = await Employee.findByPk(requesterId, { include: [User] });
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
    const data: TimeOffRequestType = await TimeOffRequest.create(req.body);

    // send notification to managers.
    const businessUnitId: number = employee.dataValues.businessUnitId;
    const firstName: string = employee.dataValues.user.firstName;
    const lastName: string = employee.dataValues.user.lastName ?? "";
    if (businessUnitId) {
        sendNotificationToManagers(businessUnitId, "New Time Off Request", `${firstName} ${lastName} has submitted a time off request.`);
    } else {
        logger.log('warn', `No businessUnit Id for employee ${req.body.requesterId}...`)
    }
    res.send(data);
}

// Retrieve all TimeOffRequests from the database.
export async function findAll(req: Request, res: Response) {
    const data: TimeOffRequestType[] = await TimeOffRequest.findAll({ include: EMPLOYEE_INCLUDES });
    res.send(data);
}

// Find a single TimeOffRequest with an id
export async function findOne(req: Request, res: Response) {
    const id: number = parseInt(req.params.id, 10);

    const data: TimeOffRequestType = await getTimeOffRequestWithShifts(id);
    res.send(data);
}

// Update a TimeOffRequest by the id in the request
export async function update(req: Request, res: Response) {
    const id: number = parseInt(req.params.id, 10);
    // throws error if not found
    await getOneForId(TimeOffRequest, id);
    if (req.body.reviewedBy) {
        await getOneForId(Employee, req.body.reviewedBy);
    }
    req.body.requesterId = undefined;
    req.body.id = undefined;

    const numUpdated: number[] = await TimeOffRequest.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`);
    }
    const updatedRequest: TimeOffRequestType = await getTimeOffRequestWithShifts(id);
    res.send(updatedRequest);
}

// Approve or Deny a TimeOffRequest
export async function approveTimeOffRequest(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    const approverId: number = parseInt(req.params.approverId as string, 10);
    const approve: Boolean = req.query.approve === "true"; // converts to boolean
    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const timeOffRequest: TimeOffRequestType = await getOneForId(TimeOffRequest, id);

    await timeOffRequest.update({
        approval: approve,
        reviewedBy: approverId,
        reviewedDate: today,
        reviewedTime: currentTime
    });

    if (approve) {
        const shifts: ShiftType[] = await getShiftsForDateRange(timeOffRequest.dataValues.requesterId, timeOffRequest.dataValues.startDate, timeOffRequest.dataValues.endDate);
        for (const shift of shifts) {
            shift.update({ employeeId: null });
        }
    }

    sendNotificationToEmployee(
        timeOffRequest.dataValues.requesterId,
        `Time Off Request ${approve ? "Approved" : "Denied"}`,
        `A manager has reviewed and ${approve ? "approved" : "denied"} your time off request.`
    );
    res.send(timeOffRequest);
}

// cannot be replaced with service because of Employee Returns
async function getTimeOffRequestWithShifts(id: number): Promise<TimeOffRequestType> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer");
    }
    const timeOffRequest: TimeOffRequestType | null = await TimeOffRequest.findByPk(id);
    if (!timeOffRequest) {
        throw new NotFoundError("Time Off Request", id);
    }
    const data: TimeOffRequestType | null = await TimeOffRequest.findByPk(id, {
        include: [
            {
                model: Employee,
                as: "timeOffReviewer",
                include: [User]
            },
            {
                model: Employee,
                as: "timeOffRequester",
                include: [User,
                    {
                        model: Shift,
                        required: false,
                        where: {
                            date: { [Op.between]: [timeOffRequest.dataValues.startDate, timeOffRequest.dataValues.endDate] }
                        }
                    }
                ]
            }
        ]
    });
    if (!data) {
        throw new NotFoundError("Time Off Request", id);
    }
    return data;
}

