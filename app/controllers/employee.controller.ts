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
import { convertDayOfWeek, convertTime, createDateFromString, getDateRange, getOneForId } from "../services/services.ts";
import AvailabilityTemplate from "../models/availabilitytemplate.model.ts";
import CoverRequest from "../models/coverrequest.model.ts";
import DropRequest from "../models/droprequest.model.ts";
import AnnouncementReceipt from "../models/announcementreceipt.model.ts";
import Announcement from "../models/announcement.model.ts";
import AnnouncementFile from "../models/announcementfile.model.ts";
import File from "../models/file.model.ts"
import Timeclock from "../models/timeclock.model.ts";
import TimeOffRequest from "../models/timeoffrequest.model.ts";

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
        if (existingEmployee.currentlyEmployed == false) {
            await existingEmployee.update({ "currentlyEmployed": true })
            const updatedEmployee = await getOneForId(Employee, existingEmployee.dataValues.id);
            res.send(updatedEmployee);
            return;
        }
        else {
            throw new AppError(409, `Employee for user ${req.body.userId} already exists at business ${req.body.businessUnitId}`)
        }
    }
    const data = await Employee.create(req.body)
    res.send(data);
}

// Retrieve all Employees from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

    const data = await Employee.findAll({ include: [User], order: [[User, "lastName", "asc"]] })
    res.send(data);
};

// Find a single User with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data = await getEmployeeForId(id);
    res.send(data);
};

exports.delete = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee = await getEmployeeForId(id);
    await employee!.update({ "currentlyEmployed": false });
    const positions = await employee.getPositions();
    for (const position of positions) {
        await employee.removePosition(position);
    }
    res.send({ message: "employee set as not currently employed." });
}

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
    await getOneForId(Employee, id);
    const startDate: string = req.query.start;
    const endDate: string = req.query.end;
    const data = await getShiftsForDateRange(id, startDate, endDate);
    res.send(data);
}

exports.getAvailableOpenShifts = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const employee = await Employee.findOne({
        where: { id },
        include: [{ model: Position, as: "positions" }]
    });
    const positions = employee.positions;
    if (positions.length == 0)
        res.status(400).send({ message: "No positions for employee. No requests available" });
    const positionIds = positions.map((position) => position.id);

    const data = await Shift.findAll({
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
    const employee = await getOneForId(Employee, id);

    //@ts-ignore
    const userId = employee.userId

    const data = await AvailabilityTemplate.findAll({ where: { userId: userId } });
    res.send(data);
}

exports.findCurrentAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee = await getOneForId(Employee, id);
    const semester = employee.dataValues.semester;

    //@ts-ignore
    const userId = employee.userId

    const data = await AvailabilityTemplate.findAll({ where: { userId: userId, semester: semester } });
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
        res.status(400).send({ message: "Something went wrong removing position" })
    }
    else {
        res.send({ message: "Position removed successfully" });
    }
}

exports.findPositions = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const employee = await getOneForId(Employee, id);
    //@ts-ignore
    const data = await employee.getPositions()
    res.send(data);
}

exports.getCoverRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const requester = req.query.requester;
    let whereCondition = {};
    if (requester === 'true') {
        whereCondition = { requesterId: id };
    } else if (requester === 'false') {
        whereCondition = { accepterId: id };
    } else {
        whereCondition = { [Op.or]: [{ requesterId: id }, { accepterId: id }] };
    }
    const includeCondition = [
        { model: Employee, as: "coverRequester", include: [User] },
        { model: Employee, as: "coverAccepter", include: [User] },
        { model: Employee, as: "coverReviewer", include: [User] },
        {
            model: Shift, include: [Position]
        }
    ];
    const data = await CoverRequest.findAll({
        where: whereCondition,
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}

exports.getAvailableCoverRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const employee = await Employee.findOne({
        where: { id },
        include: [{ model: Position, as: "positions" }]
    });
    const positions = employee.positions;
    if (positions.length == 0)
        res.status(400).send({ message: "No positions for employee. No requests available" });
    const positionIds = positions.map((position) => position.id);

    const includeCondition = [
        { model: Employee, as: "coverRequester", include: [User] },
        { model: Employee, as: "coverAccepter", include: [User] },
        { model: Employee, as: "coverReviewer", include: [User] },
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
    const data = await CoverRequest.findAll({
        where: { accepterId: null },
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}


exports.getDropRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const requester = req.query.requester;
    const includeCondition = [
        { model: Employee, as: "dropRequester", include: [User] },
        { model: Employee, as: "dropReviewer", include: [User] },
        { model: Shift, include: [Position] }
    ];
    const data = await DropRequest.findAll({
        where: { requesterId: id },
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}

exports.clearAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const employee = await getOneForId(Employee, id);
    deleteEmployeeAvailabilityTemplates(employee)
    res.send({ message: "Availability Templates cleared!" });
}

exports.importEmployeeClasses = async (req: pkg.Request, res: pkg.Response) => {
    const clear: Boolean = req.query.clear === "true";
    const id = parseInt(req.params.id as string, 10);
    const employee = await getOneForId(Employee, id);
    const semester = employee.dataValues.semester;
    const user = await employee.getUser();
    const existing = await AvailabilityTemplate.findAll({ where: { userId: user.dataValues.id, semester: semester } });
    let availabilities: Model<any, any>[] = [];
    if (clear) {
        deleteEmployeeAvailabilityTemplates(employee);
    }
    const classData = await getClassData(employee);
    for (const course of classData.Courses) {
        for (const day of course.meeting_days) {
            const fullDay = convertDayOfWeek(day);
            const startTime = convertTime(course.meeting_times[0].start_time);
            const endTime = convertTime(course.meeting_times[0].end_time);
            const userId = user.dataValues.id;
            const preference = "unavailable";
            let exists: boolean = false;
            for (const availability of existing) {
                console.log(availability)
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

            const newAvailability = await AvailabilityTemplate.create(availabilityTemplateBody);
            availabilities.push(newAvailability);
        }
    }
    res.send(availabilities);
}

async function deleteEmployeeAvailabilityTemplates(employee: Model<any, any>) {
    const user = await employee.getUser();
    const userId = user.dataValues.id;
    const data = await AvailabilityTemplate.destroy({ where: { userId: userId } });
}

async function getClassData(employee: Model<any, any>) {
    const user = await employee.getUser();
    //i.e. SP26
    const unformattedSemester: String = employee.dataValues.semester;
    //i.e. SP2026, will not work at year 2100.
    const semester = unformattedSemester.slice(0, 2) + "20" + unformattedSemester.slice(2, 4);
    const email = user.dataValues.email;
    const ocId = user.dataValues.ocId;
    //email first

    let classData = await fetch(`https://stingray.oc.edu/api/accommodationuserschedule/${email}/${semester}`);
    classData = await classData.json();
    updateUserInfo(classData, user);
    //try id
    if (classData.Success === "False") {
        classData = await fetch(`https://stingray.oc.edu/api/accommodationuserschedule/${ocId}/${semester}`);
        classData = await classData.json();
        updateUserInfo(classData, user);
        //nothing, no class data
        if (classData.Success === "False") {
            throw new AppError(404, "No classes for employee. Make sure the user has a correct email or ocId");
        }
    }
    return classData;
}

async function updateUserInfo(classData, user: Model) {
    const email: string = classData.Email;
    const ocId: string = classData.UserID;
    const updateBody = {}
    if (classData.Success === "False")
        return;
    if (!user.email) {
        updateBody.email = email;
    }
    if (!user.ocId) {
        updateBody.ocId = ocId;
    }
    const updateSucceed = await user.update(updateBody);
    if (updateSucceed)
        return;
    else
        console.log("User info did not update");
}

exports.getAvailableAnnouncementReceipts = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    await getOneForId(Employee, id);

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const data = await AnnouncementReceipt.findAll({
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
    const id = parseInt(req.params.id, 10);
    await getOneForId(Employee, id);

    const data = await Announcement.findAll({
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
    const id = parseInt(req.params.id, 10);
    const data = await getBudgetInformationForDateRange(id, req.query.start, req.query.end);
    res.send(data);
}

export async function getBudgetInformationForDateRange(employeeId: number, startDate: string, endDate: string) {
    const employee: Model = await getEmployeeForId(employeeId);
    const shifts: Model[] = await getShiftsForDateRange(employeeId, startDate, endDate);
    let expectedTotalCost: number = 0;
    let expectedTotalHours: number = 0;
    let actualTotalCost: number = 0;
    let actualTotalHours: number = 0;

    for (const shift of shifts) {
        const startTime: string = shift.dataValues.startTime;
        const endTime: string = shift.dataValues.endTime;
        //difference in ms -> hours
        const timeDiff: number = toHours(endTime) - toHours(startTime);
        const position: Model = shift.position;
        if (!position) {
            continue;
        }
        const payRate: number = position.dataValues.payRate;
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
    const returnObject = {
        "employeeId": employeeId,
        "firstName": employee.user.dataValues.firstName,
        "lastName": employee.user.dataValues.lastName,
        "expectedHoursWorked": expectedTotalHours,
        "expectedCost": expectedTotalCost,
        "actualHoursWorked": actualTotalHours,
        "actualCost": actualTotalCost
    }
    return returnObject;
}

export async function getShiftsForDateRange(id: number, startDate: string, endDate: string): Promise<Model<any, any>[]> {
    const data = await Shift.findAll({
        where: {
            employeeId: id, ...getDateRange(startDate, endDate)
        },
        include: [Position, BusinessUnit, DropRequest, CoverRequest, Timeclock],
        order: [["date", "asc"], ["startTime", "asc"]]
    });
    return data;
}

exports.getTimeOffRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(Employee, id);
    const includeCondition = [
        { model: Employee, as: "timeOffRequester", include: [User] },
        { model: Employee, as: "timeOffReviewer", include: [User] },
    ];
    const data = await TimeOffRequest.findAll({
        where: { requesterId: id },
        include: includeCondition,
        order: [["startDate", "asc"]]
    });
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

const toHours = (time: string): number => {
    const [hours, minutes, seconds] = time.split(":").map(Number);
    return hours + minutes / 60 + (seconds || 0) / 3600;
};
export default exports;
