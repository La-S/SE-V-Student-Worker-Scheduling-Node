import db from "../models/index.ts";
const Employee = db.Employee;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import type { EmployeeValuesType } from "../types/employee.type.ts";
import User, { type UserType } from "../models/user.model.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import { AppError } from "../error/app.error.ts";
import Shift, { type ShiftType } from "../models/shift.model.ts";
import Position, { type PositionType } from "../models/position.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import { convertDayOfWeek, convertTime, createDateFromString, getDateRange, getOneForId, toHours } from "../services/services.ts";
import AvailabilityTemplate, { type AvailabilityTemplateType } from "../models/availabilitytemplate.model.ts";
import CoverRequest, { type CoverRequestType } from "../models/coverrequest.model.ts";
import DropRequest, { type DropRequestType } from "../models/droprequest.model.ts";
import AnnouncementReceipt, { type AnnouncementReceiptType } from "../models/announcementreceipt.model.ts";
import Announcement, { type AnnouncementType } from "../models/announcement.model.ts";
import AnnouncementFile from "../models/announcementfile.model.ts";
import File from "../models/file.model.ts"
import Timeclock from "../models/timeclock.model.ts";
import TimeOffRequest, { type TimeOffRequestType } from "../models/timeoffrequest.model.ts";
import { sendEmployeeAssignmentEmail, sendManagerAssignmentEmail } from "../services/mailer.ts";
import { logger } from "../logger/logger.ts";
import { type EmployeeType } from "../models/employee.model.ts";

const exports: any = {};
const errorClassName = "Employee";

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const existingEmployee: EmployeeType | null = await Employee.findOne({
        where: {
            userId: req.body.userId,
            businessUnitId: req.body.businessUnitId
        }
    });
    if (existingEmployee) {
        if (existingEmployee.dataValues.currentlyEmployed == false) {
            await existingEmployee.update({ "currentlyEmployed": true })
            const updatedEmployee: EmployeeType = await getOneForId(Employee, existingEmployee.dataValues.id);
            res.send(updatedEmployee);
            return;
        }
        else {
            throw new AppError(409, `Employee for user ${req.body.userId} already exists at business ${req.body.businessUnitId}`)
        }
    }
    const data: EmployeeType = await Employee.create(req.body)
    if (req.body.currentlyEmployed !== false) {
        if (req.body.isManager === true) {
            void sendManagerAssignmentEmail(data.dataValues.id, req.body.businessUnitId);
        } else {
            void sendEmployeeAssignmentEmail(data.dataValues.id, req.body.businessUnitId);
        }
    }
    res.send(data);
}

// Retrieve all Employees from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

    const data: EmployeeType[] = await Employee.findAll({ include: [User], order: [[User, "lastName", "asc"]] })
    res.send(data);
};

// Find a single User with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data: EmployeeType = await getEmployeeForId(id);
    res.send(data);
};

exports.delete = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee: EmployeeType = await getEmployeeForId(id);
    await employee.update({ "currentlyEmployed": false });
    //@ts-ignore
    const positions = await employee.getPositions();
    for (const position of positions) {
        //@ts-ignore
        await employee.removePosition(position);
    }
    res.send({ message: "employee set as not currently employed." });
}

// Update a Employee by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    const existingEmployee: EmployeeType = await getEmployeeForId(id);
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
    let updatedEmployee: EmployeeType = await getEmployeeForId(id);
    if (existingEmployee?.dataValues.isManager !== true && req.body.isManager === true) {
        const businessUnitId = existingEmployee?.dataValues.businessUnitId;
        if (businessUnitId) {
            void sendManagerAssignmentEmail(id, businessUnitId);
        }
    }
    res.send(updatedEmployee);
};

exports.findShifts = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    await getOneForId(Employee, id);
    const startDate: string = req.query.start as string;
    const endDate: string = req.query.end as string;
    const data: ShiftType[] = await getShiftsForDateRange(id, startDate, endDate);
    res.send(data);
}

exports.getAvailableOpenShifts = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    //@ts-ignore, getOneForId checks employee exists
    const employee: EmployeeType = await Employee.findOne({
        where: { id },
        include: [{ model: Position, as: "positions" }]
    });
    //@ts-ignore
    const positions: PositionValuesType[] = employee.positions;
    if (positions.length == 0) {
        res.status(400).send({ message: "No positions for employee. No requests available" });
        return;
    }
    const positionIds = positions.map((position) => position.id);

    const data: ShiftType[] = await Shift.findAll({
        where: {
            employeeId: null,
            [Op.or]: [
                { date: { [Op.gt]: today } },
                {
                    date: { [Op.eq]: today },
                    startTime: { [Op.gte]: currentTime }
                }
            ],
            positionId: { [Op.in]: positionIds }
        },
        include: [Position],
        order: [["date", "asc"], ["startTime", "asc"]]
    });
    res.send(data);
}

exports.findAllAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee: EmployeeType = await getOneForId(Employee, id);

    //@ts-ignore
    const userId: number = employee.userId

    const data: AvailabilityTemplateType[] = await AvailabilityTemplate.findAll({ where: { userId: userId } });
    res.send(data);
}

exports.findCurrentAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee: EmployeeType = await getOneForId(Employee, id);
    const semester: string = employee.dataValues.semester;

    //@ts-ignore
    const userId: number = employee.userId

    const data: AvailabilityTemplateType[] = await AvailabilityTemplate.findAll({ where: { userId: userId, semester: semester } });
    res.send(data);
}

exports.findAvailabilityTemplatesForSemester = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee: EmployeeType = await getOneForId(Employee, id);
    const semester: string = req.params.semester;

    //@ts-ignore
    const userId: number = employee.userId

    const data: AvailabilityTemplateType[] = await AvailabilityTemplate.findAll({ where: { userId: userId, semester: semester } });
    res.send(data);
}

exports.addPosition = async (req: pkg.Request, res: pkg.Response) => {
    const employeeId: number = parseInt(req.params.id, 10);
    const positionId: number = parseInt(req.params.positionid, 10)

    if (!employeeId || !positionId) {
        throw new AppError(400, "one of the entered ids is not a number")
    }

    const employee: EmployeeType | null = await Employee.findByPk(employeeId);
    if (!employee) {
        throw new NotFoundError(errorClassName, employeeId);
    }
    const position: PositionType | null = await Position.findByPk(positionId);
    if (!position) {
        throw new NotFoundError("Position", positionId);
    }
    //@ts-ignore
    const data: any = await employee.addPosition(position);
    if (!data) {
        res.status(400).send({ message: "Something went wrong adding position" })
    }
    else {
        res.send({ message: "Position added successfully" });
    }
}


exports.removePosition = async (req: pkg.Request, res: pkg.Response) => {
    const employeeId: number = parseInt(req.params.id, 10);
    const positionId: number = parseInt(req.params.positionid, 10)

    if (!employeeId || !positionId) {
        throw new AppError(400, "one of the entered ids is not a number")
    }

    const employee: EmployeeType | null = await Employee.findByPk(employeeId);
    if (!employee) {
        throw new NotFoundError(errorClassName, employeeId);
    }
    const position: PositionType | null = await Position.findByPk(positionId);
    if (!position) {
        throw new NotFoundError("Position", positionId);
    }
    //@ts-ignore
    const data: any = await employee.removePosition(position);
    if (!data) {
        res.status(400).send({ message: "Something went wrong removing position" })
    }
    else {
        res.send({ message: "Position removed successfully" });
    }
}

exports.findPositions = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee: EmployeeType = await getOneForId(Employee, id);
    //@ts-ignore
    const data: any = await employee.getPositions()
    res.send(data);
}

exports.getCoverRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const requester: string = req.query.requester as string;
    let whereCondition = {};
    if (requester === 'true') {
        whereCondition = { requesterId: id };
    } else if (requester === 'false') {
        whereCondition = { accepterId: id };
    } else {
        whereCondition = { [Op.or]: [{ requesterId: id }, { accepterId: id }] };
    }
    const includeCondition = [
        { model: Employee, as: "coverRequester", required: false, include: [User] },
        { model: Employee, as: "coverAccepter", required: false, include: [User] },
        { model: Employee, as: "coverReviewer", required: false, include: [User] },
        {
            model: Shift, include: [Position]
        }
    ];
    const data: CoverRequestType[] = await CoverRequest.findAll({
        where: whereCondition,
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}

exports.getAvailableCoverRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const employee: EmployeeType | null = await Employee.findOne({
        where: { id },
        include: [{ model: Position, as: "positions" }]
    });
    //@ts-ignore
    const positions: PositionValuesType[] = employee?.positions || [];
    if (positions.length == 0)
        res.status(400).send({ message: "No positions for employee. No requests available" });
    const positionIds: number[] = positions.map((position) => position.id);

    const includeCondition = [
        { model: Employee, as: "coverRequester", required: false, include: [User] },
        { model: Employee, as: "coverAccepter", required: false, include: [User] },
        { model: Employee, as: "coverReviewer", required: false, include: [User] },
        {
            model: Shift,
            required: true,
            where: {
                [Op.or]: [
                    { date: { [Op.gt]: today } },
                    {
                        date: { [Op.eq]: today },
                        startTime: { [Op.gte]: currentTime }
                    }
                ],
                positionId: { [Op.in]: positionIds },
                employeeId: { [Op.not]: id }
            },
            include: [Position]
        }
    ];
    const data: CoverRequestType[] = await CoverRequest.findAll({
        where: { accepterId: null },
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}


exports.getDropRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const requester: string = req.query.requester as string;
    const includeCondition = [
        { model: Employee, as: "dropRequester", include: [User] },
        { model: Employee, as: "dropReviewer", required: false, include: [User] },
        { model: Shift, include: [Position] }
    ];
    const data: DropRequestType[] = await DropRequest.findAll({
        where: { requesterId: id },
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}

exports.clearAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);
    const employee: EmployeeType = await getOneForId(Employee, id);
    deleteEmployeeAvailabilityTemplates(employee)
    res.send({ message: "Availability Templates cleared!" });
}

exports.clearAvailabilityTemplatesForSemester = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);
    const employee: EmployeeType = await getOneForId(Employee, id);
    //@ts-ignore
    const user: UserType = await employee.getUser();
    const userId: number = user.dataValues.id;
    const semester: string = req.query.semester ?? employee.dataValues.semester;
    await AvailabilityTemplate.destroy({ where: { userId: userId, semester: semester } });
    res.send({ message: `Availability Templates for semester ${semester} cleared!` });
}

exports.importEmployeeClasses = async (req: pkg.Request, res: pkg.Response) => {
    const clear: boolean = req.query.clear === "true";
    const id: number = parseInt(req.params.id as string, 10);
    const employee: EmployeeType = await getOneForId(Employee, id);
    const availabilities: AvailabilityTemplateType[] = await loadEmployeeClassUnavailability(employee, clear);
    if (availabilities.length == 0) {
        res.send({ message: "No class data found for employee. No availability templates created." });
        return;
    }
    res.send(availabilities);
}

export async function loadEmployeeClassUnavailability(employee: Model<any, any>, clear: boolean): Promise<Model<any, any>[]> {
    const semester: string = employee.dataValues.semester;
    //@ts-ignore
    const user: UserType = await employee.getUser();
    const existing: AvailabilityTemplateType[] = await AvailabilityTemplate.findAll({ where: { userId: user.dataValues.id, semester: semester } });
    let availabilities: Model<any, any>[] = [];
    if (clear) {
        deleteEmployeeAvailabilityTemplates(employee);
    }
    const classData: any = await getClassData(employee);
    if (!classData || !classData.Courses) {
        return [];
    }
    for (const course of classData.Courses) {
        for (const day of course.meeting_days) {
            const fullDay: string = convertDayOfWeek(day);
            const startTime: string = convertTime(course.meeting_times[0].start_time);
            const endTime: string = convertTime(course.meeting_times[0].end_time);
            const userId: number = user.dataValues.id;
            const preference: string = "unavailable";
            let exists: boolean = false;
            for (const availability of existing) {
                if (availability.dataValues.dayOfWeek === fullDay && availability.dataValues.startTime === startTime && availability.dataValues.endTime === endTime && availability.dataValues.semester === semester) {
                    exists = true;
                    break;
                }
                if (exists) {
                    continue;
                }
            }
            if (exists) {
                continue;
            }
            const availabilityTemplateBody = {
                "dayOfWeek": fullDay,
                "startTime": startTime,
                "endTime": endTime,
                "preference": preference,
                "userId": userId,
                "semester": semester
            };

            const newAvailability: AvailabilityTemplateType = await AvailabilityTemplate.create(availabilityTemplateBody);
            availabilities.push(newAvailability);
        }
    }
    return availabilities;
}

async function deleteEmployeeAvailabilityTemplates(employee: Model<any, any>) {
    //@ts-ignore
    const user: UserType = await employee.getUser();
    const userId: number = user.dataValues.id;
    const data: number = await AvailabilityTemplate.destroy({ where: { userId: userId } });
}

async function getClassData(employee: Model<any, any>) {
    //@ts-ignore
    const user: UserType = await employee.getUser();
    //i.e. SP26
    const unformattedSemester: string = employee.dataValues.semester;
    //i.e. SP2026, will not work at year 2100.
    const semester: string = unformattedSemester.slice(0, 2) + "20" + unformattedSemester.slice(2, 4);
    const email: string = user.dataValues.email;
    const ocId: string = user.dataValues.ocId;
    //email first

    let classData: any = await fetch(`https://stingray.oc.edu/api/accommodationuserschedule/${email}/${semester}`);
    classData = await classData.json();
    updateUserInfo(classData, user);
    //try id
    if (classData.Success === "False") {
        classData = await fetch(`https://stingray.oc.edu/api/accommodationuserschedule/${ocId}/${semester}`);
        classData = await classData.json();
        updateUserInfo(classData, user);
        //nothing, no class data
        if (classData.Success === "False") {
            return null;
        }
        if (classData.Message && classData.Message.includes("No HTTP resource was found that matches the request URI")) {
            return null;
        }
    }
    return classData;
}

async function updateUserInfo(classData: any, user: UserType) {
    const email: string = classData.Email;
    const ocId: string = classData.UserID;
    const updateBody: any = {};
    if (classData.Success === "False")
        return;
    if (!user.dataValues.email) {
        updateBody.email = email;
    }
    if (!user.dataValues.ocId) {
        updateBody.ocId = ocId;
    }
    const updateSucceed: UserType = await user.update(updateBody);
    if (updateSucceed)
        return;
    else
        logger.log("warn", "user info did not update properly.")
}

exports.getAvailableAnnouncementReceipts = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    await getOneForId(Employee, id);

    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const data: AnnouncementReceiptType[] = await AnnouncementReceipt.findAll({
        where: {
            employeeId: id,
            deleted: false
        },
        include: [
            {
                model: Announcement,
                required: true,
                where: {
                    [Op.or]: [
                        { postAtDate: { [Op.lt]: today } },
                        {
                            postAtDate: today,
                            postAtTime: { [Op.lte]: currentTime }
                        }
                    ]
                },
                include: [
                    {
                        model: Employee,
                        include: [User]
                    },
                    {
                        model: AnnouncementFile
                    }
                ]
            }
        ],
        order: [
            [Announcement, "postAtDate", "desc"],
            [Announcement, "postAtTime", "desc"]
        ]
    });
    res.send(data);
};

exports.findAuthoredAnnouncements = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    await getOneForId(Employee, id);

    const data: AnnouncementType[] = await Announcement.findAll({
        where: {
            authorId: id,
        },
        include: [
            {
                model: AnnouncementReceipt,
                required: true,
                include: [
                    {
                        model: Employee,
                        include: [User]
                    }
                ],
            },
            {
                model: AnnouncementFile
            }
        ],
        order: [
            ["postAtDate", "desc"],
            ["postAtTime", "desc"]
        ]
    });
    res.send(data);
};

exports.getBudgetForDateRange = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    const data: any = await getBudgetInformationForDateRange(id, req.query.start as string, req.query.end as string);
    res.send(data);
}

export async function getBudgetInformationForDateRange(employeeId: number, startDate: string, endDate: string) {
    const employee: EmployeeType = await getEmployeeForId(employeeId);
    const shifts: ShiftType[] = await getShiftsForDateRange(employeeId, startDate, endDate);
    let expectedTotalCost: number = 0;
    let expectedTotalHours: number = 0;
    let actualTotalCost: number = 0;
    let actualTotalHours: number = 0;

    for (const shift of shifts) {
        const startTime: string = shift.dataValues.startTime;
        const endTime: string = shift.dataValues.endTime;
        //difference in ms -> hours
        const timeDiff: number = toHours(endTime) - toHours(startTime);
        //@ts-ignore
        const position: PositionType = shift.position;
        if (!position) {
            continue;
        }
        const payRate: number = position.dataValues.payRate;
        //@ts-ignore
        for (const timeclock of shift.timeclocks) {
            const clockIn: string = timeclock.clockIn;
            const clockOut: string = timeclock.clockOut;
            //ignore cases where the person failed to clock in or out. Warning on FE?
            if (!clockIn || !clockOut) {
                continue;
            }
            const clockedInTime: number = toHours(clockOut) - toHours(clockIn);
            actualTotalHours += clockedInTime;
            actualTotalCost += clockedInTime * payRate
        }
        expectedTotalHours += timeDiff;
        expectedTotalCost += timeDiff * payRate;
    }
    //@ts-ignore
    const user: UserType = employee.user;
    const returnObject = {
        "employeeId": employeeId,
        "firstName": user.dataValues.firstName,
        "lastName": user.dataValues.lastName,
        "expectedHoursWorked": expectedTotalHours,
        "expectedCost": expectedTotalCost,
        "actualHoursWorked": actualTotalHours,
        "actualCost": actualTotalCost
    }
    return returnObject;
}

export async function getShiftsForDateRange(id: number, startDate: string, endDate: string): Promise<ShiftType[]> {
    const data: ShiftType[] = await Shift.findAll({
        where: {
            employeeId: id, ...getDateRange(startDate, endDate)
        },
        include: [Position, BusinessUnit, DropRequest, CoverRequest, Timeclock],
        order: [["date", "asc"], ["startTime", "asc"]]
    });
    return data;
}

exports.getTimeOffRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const includeCondition = [
        { model: Employee, as: "timeOffRequester", include: [User] },
        { model: Employee, as: "timeOffReviewer", include: [User] },
    ];
    const data: TimeOffRequestType[] = await TimeOffRequest.findAll({
        where: { requesterId: id },
        include: includeCondition,
        order: [["startDate", "asc"]]
    });
    res.send(data);
}

//cannot be replaced with service because of user in return
async function getEmployeeForId(id: number): Promise<EmployeeType> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data: EmployeeType | null = await Employee.findByPk(id, { include: [User] });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}

export default exports;
