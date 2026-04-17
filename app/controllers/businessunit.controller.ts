import pkg from 'express'
import Shift from "../models/shift.model.ts"
import BusinessUnit from '../models/businessunit.model.ts';
import { Model, Op } from 'sequelize';
import Employee from '../models/employee.model.ts';
import User from '../models/user.model.ts';
import Position from '../models/position.model.ts';
import TaskList from '../models/tasklist.model.ts';
import { createDateFromString, getDateRange, getOneForId, getStringFromDate, incrementSemester } from '../services/services.ts';
import AvailabilityTemplate from '../models/availabilitytemplate.model.ts';
import WeeklyScheduleTemplate from '../models/weeklyscheduletemplate.model.ts';
import OpenHours from '../models/openhours.model.ts';
import { deleteShiftsForWeek } from './shift.controller.ts';
import { sendNotificationToBusinessUnit } from '../services/notifications.ts';
import { AppError } from "../error/app.error.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";
import CoverRequest from '../models/coverrequest.model.ts';
import DropRequest from '../models/droprequest.model.ts';
import Timeclock from '../models/timeclock.model.ts';
import { getBudgetInformationForDateRange } from './employee.controller.ts';
import TimeOffRequest from '../models/timeoffrequest.model.ts';
const exports: any = {}

exports.findShifts = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const startDate = req.query.start;
    const endDate = req.query.end;
    const includeCondition = [
        { model: Employee, include: [User] },
        { model: Position },
        { model: TaskList, as: "taskList" },
        { model: Timeclock }
    ];
    const data = await Shift.findAll({
        where: { businessUnitId: id, ...getDateRange(startDate, endDate) },
        include: includeCondition
    });
    res.send(data);
};


exports.findTaskLists = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data = await TaskList.findAll({ where: { businessUnitId: id } });
    res.send(data);
}

exports.findCurrentEmployees = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data = await Employee.findAll({
        where: { businessUnitId: id, currentlyEmployed: true },
        order: [[User, "lastName", "asc"]],
        include: User,
    });
    res.send(data);
}

exports.findAllEmployees = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data = await Employee.findAll({
        where: { businessUnitId: id },
        order: [[User, "lastName", "asc"]],
        include: User,
    });
    res.send(data);
}

exports.findPositions = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data = await Position.findAll({ where: { businessUnitId: id }, order: [["name", "asc"]] });
    res.send(data);
}

exports.findWeeklySchedules = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    //I dont think this should include dailyschedules and shifts when getting all but lmk if you disagree
    const data = await WeeklyScheduleTemplate.findAll({ where: { businessUnitId: id }, });
    res.send(data);
}

exports.findOpenHours = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data = await OpenHours.findAll({
        where: { businessUnitId: id },
        order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]]
    });
    res.send(data);
}

exports.findOpenHoursForDay = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const dayInput = req.params.dayOfWeek;
    const dayIndex = Number(dayInput);
    const dayOfWeek = Number.isInteger(dayIndex) && dayIndex >= 1 && dayIndex <= daysOfWeek.length
        ? daysOfWeek[dayIndex - 1]
        : dayInput as string;

    if (!daysOfWeek.includes(dayOfWeek as typeof daysOfWeek[number])) {
        throw new AppError(400, `dayOfWeek must be one of: ${daysOfWeek.join(", ")}`);
    }

    const data = await OpenHours.findAll({
        where: { businessUnitId: id, dayOfWeek },
        order: [["startTime", "ASC"]]
    });
    res.send(data);
}

exports.findAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const businessUnit: Model = await getOneForId(BusinessUnit, id);
    const employees = await Employee.findAll({ where: { businessUnitId: id, currentlyEmployed: true } });
    let currentSemester = null
    //if not defined in request, get the current semester and increment it (FA26 -> SP27)
    if (!currentSemester) {
        currentSemester = getMostCommonSemester(employees);
    }
    const data = await AvailabilityTemplate.findAll({
        where: {semester: currentSemester},
        include: [{
            model: User,
            required: true, //REQUIRED. DO NOT REMOVE
            include: [{
                model: Employee,
                where: { businessUnitId: id },
            }]
        }]
    });
    res.send(data);
}

//should include AvailabilityModification later
exports.findAvailabilityForDate = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const businessUnit = await getOneForId(BusinessUnit, id);
    const date = req.query.date; //not required
    const dayOfWeek = req.query.dayofweek; //maybe required?
    const startTime = req.query.start; //required
    const endTime = req.query.end; //required
    const acceptablePreferences = ["available", "preferred"];

    const allEmployees = await Employee.findAll({
        where: { businessUnitId: id },
        include: User
    });
    const availableEmployees = await Employee.findAll({
        where: { businessUnitId: id },
        include: {
            model: User,
            required: true,
            include: [{
                model: AvailabilityTemplate,
                where: {
                    dayOfWeek: dayOfWeek,
                    [Op.and]: {
                        startTime: { [Op.lte]: startTime },
                        endTime: { [Op.gte]: endTime }
                    },
                    //only users where their availability is "available" or "preferred". Unavailable assumed
                    preference: { [Op.in]: acceptablePreferences }
                }
            }]
        }
    });

    res.send(availableEmployees);
}

exports.publishShiftsForWeek = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const startDate = req.params.date as string;
    await getOneForId(BusinessUnit, id);
    const startDateObject = createDateFromString(startDate);
    const endDateObject = new Date(startDateObject);
    endDateObject.setDate(endDateObject.getDate() + 6);
    const endDate = getStringFromDate(endDateObject);

    Shift.update({ "published": true }, {
        where:
        {
            businessUnitId: id,
            date: { [Op.between]: [startDate, endDate] }
        }
    });

    sendNotificationToBusinessUnit(id, startDate);

    res.send({ message: "shifts published!" });
}

exports.getCoverRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const startDate = req.query.start;
    const endDate = req.query.end;
    const dateRange = getDateRange(startDate, endDate);
    const includeCondition = [
        { model: Employee, as: "coverRequester", include: [User] },
        { model: Employee, as: "coverAccepter", include: [User] },
        { model: Employee, as: "coverReviewer", include: [User] },
        {
            model: Shift,
            required: true,
            where: { businessUnitId: id, ...dateRange },
            include: [Position]
        }
    ];
    const data = await CoverRequest.findAll({
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
};

exports.getUpcomingOpenCoverRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    const includeCondition = [
        { model: Employee, as: "coverRequester", include: [User] },
        { model: Employee, as: "coverAccepter", include: [User] },
        { model: Employee, as: "coverReviewer", include: [User] },
        {
            model: Shift,
            include: [Position, BusinessUnit],
            as: 'shift',
            required: true,
            where: {
                businessUnitId: id,
                [Op.or]: [
                    { date: { [Op.gt]: today } },
                    {
                        date: { [Op.eq]: today },
                        startTime: { [Op.gte]: currentTime }
                    }
                ]
            }
        }
    ];
    const data = await CoverRequest.findAll({
        where: { approval: null },
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}

exports.getDropRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const startDate = req.query.start;
    const endDate = req.query.end;
    const dateRange = getDateRange(startDate, endDate);
    const includeCondition = [
        { model: Employee, as: "dropRequester", include: [User] },
        { model: Employee, as: "dropReviewer", include: [User] },
        {
            model: Shift,
            include: [Position],
            required: true,
            where: { businessUnitId: id, ...dateRange },
        }
    ];
    const data = await DropRequest.findAll({
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
};

exports.deleteShiftsForWeek = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const dateString: string = req.params.date;
    const startDate: Date = createDateFromString(dateString);
    deleteShiftsForWeek(startDate, id);
    res.send({ message: "Shifts cleared" });
}

exports.getUpcomingOpenDropRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    const includeCondition = [
        { model: Employee, as: "dropRequester", include: [User] },
        { model: Employee, as: "dropReviewer", include: [User] },
        {
            model: Shift,
            as: 'shift',
            required: true,
            include: [Position],
            where: {
                businessUnitId: id,
                [Op.or]: [
                    { date: { [Op.gt]: today } },
                    {
                        date: { [Op.eq]: today },
                        startTime: { [Op.gte]: currentTime }
                    }
                ]
            }
        }
    ];
    const data = await DropRequest.findAll({
        where: { approval: null },
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}

exports.findOpenShifts = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    const includeCondition = [
        { model: Employee, include: [User] },
        { model: Position },
        { model: TaskList, as: "taskList" }
    ];
    const data = await Shift.findAll({
        where: {
            businessUnitId: id, employeeId: null, published: true,
            [Op.or]: [
                { date: { [Op.gt]: today } },
                {
                    date: { [Op.eq]: today },
                    startTime: { [Op.gte]: currentTime }
                }
            ]
        },
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
};

exports.getBudgetInformationForDateRange = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const startDate: string = req.query.start;
    const endDate: string = req.query.end;
    await getOneForId(BusinessUnit, id);
    const employees: Model[] = await Employee.findAll({ where: { businessUnitId: id, currentlyEmployed: true } });
    if (employees.length == 0) {
        throw new AppError(400, "No employees currently employed for business");
    }
    const returnObject = [];
    for (const employee of employees) {
        const employeeId = employee.dataValues.id;
        const employeeInfo = await (getBudgetInformationForDateRange(employeeId, startDate, endDate));
        returnObject.push(employeeInfo);
    }
    res.send(returnObject);
}

exports.rolloverEmployees = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const businessUnit: Model = await getOneForId(BusinessUnit, id);
    const employees = await Employee.findAll({ where: { businessUnitId: id, currentlyEmployed: true } });
    let semester: string = req.query.semester;
    //if not defined in request, get the current semester and increment it (FA26 -> SP27)
    if (!semester) {
        semester = getMostCommonSemester(employees);
        semester = incrementSemester(semester);
    }
    for (const employee of employees) {
        await employee.update({ semester: semester });
    }
    res.send({ message: `Employees updated to semester ${semester}` });
}

function getMostCommonSemester(employees: Model[]) {
    const semesters: Map<string, number> = new Map();

    for (const employee of employees) {
        const semester: string = employee.dataValues.semester;
        if (semester) {
            const currentValue: number | undefined = semesters.get(semester);
            if (!currentValue) {
                semesters.set(semester, 1);
            }
            else {
                semesters.set(semester, currentValue + 1);
            }
        }
    }
    let mostCommonSemester = "";
    let mostCommonSemesterCount = 0;
    semesters.forEach((value, key) => {
        if (value > mostCommonSemesterCount) {
            mostCommonSemesterCount = value;
            mostCommonSemester = key;
        }
    })
    return mostCommonSemester;
}

exports.getAllTimeOffRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const includeCondition = [
        { model: Employee, as: "timeOffRequester", include: [User], where: { businessUnitId: id } },
        { model: Employee, as: "timeOffReviewer", include: [User], where: { businessUnitId: id } },
    ];
    const data = await TimeOffRequest.findAll({
        include: includeCondition,
        order: [["startDate", "asc"]]
    });
    res.send(data);
};

exports.getTimeOffRequestsDateRange = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const dateRangeStart = req.params.start;
    const dateRangeEnd = req.params.end;
    const includeCondition = [
        { model: Employee, as: "timeOffRequester", include: [User], where: { businessUnitId: id } },
        { model: Employee, as: "timeOffReviewer", include: [User], where: { businessUnitId: id } },
    ];
    const data = await TimeOffRequest.findAll({
        include: includeCondition,
        where: { startDate: { [Op.lte]: dateRangeEnd }, endDate: { [Op.gte]: dateRangeStart } },
        order: [["startDate", "asc"]]
    });
    res.send(data);
};

exports.deleteShiftsForWeek = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const dateString: string = req.params.date;
    const startDate: Date = createDateFromString(dateString);
    deleteShiftsForWeek(startDate, id);
    res.send({ message: "Shifts cleared" });
}

exports.getUpcomingOpenTimeOffRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const business = await getOneForId(BusinessUnit, id);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const timeOffRequestsWithShifts = [];
    const employees: Model[] = await business.getEmployees();
    console.log(employees);
    const employeeIds: number[] = employees.map((employee: Model) => { return employee.dataValues.id });
    const timeOffRequests = await TimeOffRequest.findAll({
        where: {
            requesterId: {
                [Op.in]: employeeIds
            },
            startDate: {
                [Op.gte]: today
            },
            approval: null
        },
        include: [{
            model: Employee,
            as: "timeOffRequester"
        }],
    });

    for (const timeOffRequest of timeOffRequests) {
        const shifts = await Shift.findAll({
            where: {
                employeeId: timeOffRequest.dataValues.requesterId,
                date: {
                    [Op.between]: [timeOffRequest.dataValues.startDate, timeOffRequest.dataValues.endDate]
                }
            }
        });
        timeOffRequest.dataValues.Shifts = shifts;
    }

    res.send(timeOffRequests);
}

async function getUnavailableEmployees(employees: Model<any, any>[]) {
    // const unavailableEmployees = await Employee.findAll({
    //     where: { businessUnitId: id },
    //     include: {
    //         model: User,
    //         required: true,
    //         include: [{
    //             model: AvailabilityTemplate,
    //             where: {
    //                 dayOfWeek: dayOfWeek,
    //                //TODO: fix inner bound exception (starttime > and endtime <)
    //                 [Op.or]: {
    //                     startTime: {[Op.lte]: startTime},
    //                     endTime: {[Op.gte]: endTime}
    //                 },
    //                 //only users where their availability is "available" or "preferred". Unavailable assumed
    //                 preference: {[Op.in]: acceptablePreferences} 
    //             }
    //         }]
    //     }
    // });

    // const unavailableEmployeeIds = unavailableEmployees.map((employee) => {
    //     return employee.dataValues.id;
    // })
}

export default exports;
