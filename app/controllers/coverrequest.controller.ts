import { Model } from "sequelize";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import CoverRequest, { type CoverRequestType } from "../models/coverrequest.model.ts";
import Employee, { type EmployeeType } from "../models/employee.model.ts";
import { type Request, type Response } from 'express';
import User from "../models/user.model.ts";
import { getOneForId, toHours } from "../services/services.ts";
import Shift from "../models/shift.model.ts";
import { sendNotificationToEmployee, sendNotificationToManagers, sendNotificationToOtherEmployees } from "../services/notifications.ts";
import { getUserExpectedHoursForWeek } from "./user.controller.ts";
import { logger } from "../logger/logger.ts";

const errorClassName: string = "Cover Request";

const EMPLOYEE_INCLUDES = [
    { model: Employee, as: "coverRequester", required: false, include: [User] },
    { model: Employee, as: "coverAccepter", required: false, include: [User] },
    { model: Employee, as: "coverReviewer", required: false, include: [User] },
];

// Create and Save a new CoverRequest
export async function create(req: Request, res: Response) {
    req.body.id = undefined;
    const data: CoverRequestType = await CoverRequest.create(req.body);

    // send notification to required parties.
    if (req.body.requesterId) {
        // don't wait for this response.
        const employee: EmployeeType | null = await Employee.findByPk(req.body.requesterId, { include: [User] });
        const businessUnitId: number = employee?.dataValues.businessUnitId;
        const firstName: string = employee?.dataValues.user.firstName;
        const lastName: string = employee?.dataValues.user?.lastName ?? "";
        if (businessUnitId) {
            sendNotificationToOtherEmployees(req.body.requesterId, businessUnitId, "New Cover Request", `${firstName} ${lastName} needs someone to cover an upcoming shift.`);
        } else {
            logger.log('warn', `No businessUnit Id for employee ${req.body.requesterId}...`)
        }
    }
    res.send(data);
}

// Retrieve all Cover Requests from the database.
export async function findAll(req: Request, res: Response) {

    const data: CoverRequestType[] = await CoverRequest.findAll({ include: EMPLOYEE_INCLUDES })
    res.send(data);
}

// Find a single Cover Request with an id
export async function findOne(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);

    const data: CoverRequestType = await getCoverRequestForId(id);
    res.send(data);
}

// Update a CoverRequest by the id in the request
export async function update(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getCoverRequestForId(id);

    //a cover request should refer to a requesterId and shiftId, these should not change
    req.body.requesterId = undefined;
    req.body.shiftId = undefined;
    req.body.id = undefined;

    const numUpdated = await CoverRequest.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedRequest = await getCoverRequestForId(id);
    res.send(updatedRequest);
}

export async function acceptCoverRequest(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);
    const coverRequest = await getOneForId(CoverRequest, id);
    if (coverRequest!.dataValues.accepterId !== null) {
        throw new AppError(400, "This cover request has already been accepted.")
    }
    const employeeId = parseInt(req.params.employeeId as string, 10);
    const employee = await getOneForId(Employee, employeeId);
    const user = await getOneForId(User, employee.dataValues.id);
    const businessUnitId = employee.dataValues.businessUnitId; // a little sketchy getting businessUnitId from employee, but it should work.
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    //@ts-ignore
    const shift = await coverRequest.getShift();
    const hoursWorkedForUser = await getUserExpectedHoursForWeek(user.dataValues.id, shift.dataValues.date);
    const hoursForShift: number = toHours(shift.dataValues.endTime) - toHours(shift.dataValues.startTime);
    if (user.dataValues.isStudent && (hoursWorkedForUser + hoursForShift > 20)){
        throw new AppError(403, "Accepting this cover request would put the user over 20 hours worked for the week.")
    }
    await coverRequest.update({
        accepterId: employeeId,
        acceptDate: today,
        acceptTime: currentTime
    });

    if (coverRequest.dataValues.requesterId) {
        sendNotificationToEmployee(coverRequest.dataValues.requesterId, "Shift picked up", "Pending approval from your manager.")
    }
    sendNotificationToManagers(businessUnitId, "New cover request", "A cover requests needs your review")
    res.send(coverRequest);
}

export async function approveCoverRequest(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);
    const approverId = parseInt(req.params.approverId as string, 10);
    const approve: Boolean = req.query.approve === "true"; //converts to boolean
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const coverRequest = await getOneForId(CoverRequest, id);
    if (coverRequest.dataValues.accepterId == null) {
        throw new AppError(400, "This cover request has not been accepted yet.");
    }

    if (approve == true) {
        const shift = await getOneForId(Shift, coverRequest.dataValues.shiftId);
        await shift.update({ employeeId: coverRequest.dataValues.accepterId });
    }

    await coverRequest.update({
        approval: approve,
        reviewedBy: approverId,
        reviewedDate: today,
        reviewedTime: currentTime
    });

    if (coverRequest.dataValues.requesterId) {
        sendNotificationToEmployee(coverRequest.dataValues.requesterId, `Cover Request ${approve ? "Approved" : "Denied"}`, `A manager has reviewed and ${approve ? "approved" : "denied"} your cover request`);
    }
    if (coverRequest.dataValues.accepterId) {
        sendNotificationToEmployee(coverRequest.dataValues.accepterId, `Cover Request ${approve ? "Approved" : "Denied"}`, `A shift you wanted to pick up has been ${approve ? "approved" : "denied"}.`);
    }

    res.send(coverRequest);
}

//cannot be replaced with service because of user in return
async function getCoverRequestForId(id: number): Promise<CoverRequestType> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data: CoverRequestType | null = await CoverRequest.findByPk(id, { include: EMPLOYEE_INCLUDES });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}
