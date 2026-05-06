import pkg from 'express'
import Shift from "../models/shift.model.ts"
import BusinessUnit from '../models/businessunit.model.ts';
import { Model, Op } from 'sequelize';
import Employee from '../models/employee.model.ts';
import User from '../models/user.model.ts';
import Position from '../models/position.model.ts';
import TaskList from '../models/tasklist.model.ts';
import { convertIntDayOfWeek, createDateFromString, getDateRange, getOneForId, getOneForStringId, getStringFromDate, incrementSemester } from '../services/services.ts';
import AvailabilityTemplate from '../models/availabilitytemplate.model.ts';
import WeeklyScheduleTemplate from '../models/weeklyscheduletemplate.model.ts';
import OpenHours from '../models/openhours.model.ts';
import { deleteShiftsForWeek } from './shift.controller.ts';
import { sendNotificationToBusinessUnit } from '../services/notifications.ts';
import { sendEmailToBusinessUnit } from '../services/mailer.ts';
import { AppError } from "../error/app.error.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";
import CoverRequest from '../models/coverrequest.model.ts';
import DropRequest from '../models/droprequest.model.ts';
import Timeclock from '../models/timeclock.model.ts';
import { getBudgetInformationForDateRange, loadEmployeeClassUnavailability } from './employee.controller.ts';
import { getBusinessUnitSettingValue } from './businessunitsettingvalue.controller.ts';
import SettingIntMapping from '../models/settingintmapping.model.ts';
import Setting from '../models/setting.model.ts';
import BusinessUnitSettingValue from '../models/businessunitsettingvalue.model.ts';
import { get } from 'node:http';
import TimeOffRequest from '../models/timeoffrequest.model.ts';
import { NotFoundError } from '../error/notfound.error.ts';
import type { AvailabilityPreference } from '../types/availabilitypreference.enum.ts';
const exports: any = {}


exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const data = await BusinessUnit.create(req.body);
    const settings = await Setting.findAll({ where: { isForBusinessUnit: true } });
    for (const setting of settings) {
        await BusinessUnitSettingValue.create({
            businessUnitId: data.dataValues.id,
            settingCode: setting.dataValues.code,
            settingValue: setting.dataValues.defaultValue
        });
    }
    res.send(data);
}

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
        where: { semester: currentSemester },
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

    await Promise.allSettled([
        sendNotificationToBusinessUnit(id, startDate),
        sendEmailToBusinessUnit(
            id,
            `Shifts Published for Week of ${startDate}`,
            `Shifts have been published for the week of ${startDate}.`,
        ),
    ]);

    res.send({ message: "shifts published!" });
}

exports.getCoverRequests = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const startDate = req.query.start;
    const endDate = req.query.end;
    const dateRange = getDateRange(startDate, endDate);
    const includeCondition = [
        { model: Employee, as: "coverRequester", required: false, include: [User] },
        { model: Employee, as: "coverAccepter", required: false, include: [User] },
        { model: Employee, as: "coverReviewer", required: false, include: [User] },
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
        { model: Employee, as: "coverRequester", required: false, include: [User] },
        { model: Employee, as: "coverAccepter", required: false, include: [User] },
        { model: Employee, as: "coverReviewer", required: false, include: [User] },
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
    let loadClasses = req.query.loadclasses === "true";
    let semester: string = req.query.semester;
    //if not defined in request, get the current semester and increment it (FA26 -> SP27)
    if (!semester) {
        semester = getMostCommonSemester(employees);
        semester = incrementSemester(semester);
    }
    for (const employee of employees) {
        await employee.update({ semester: semester });
        if (loadClasses) {
            //probably shouldnt await since it shouldn't return and will take a WHILE
            await loadEmployeeClassUnavailability(employee, true);
        }
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
        { model: Employee, as: "timeOffReviewer", required: false, include: [User], where: { businessUnitId: id } },
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
        { model: Employee, as: "timeOffReviewer", required:false, include: [User], where: { businessUnitId: id } },
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

exports.getSingleSettingValue = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    await getOneForStringId(Setting, req.params.code);
    const businessUnitId = parseInt(req.params.id as string, 10);
    const settingCode = req.params.code as string;
    const settingValue = await getBusinessUnitSettingValue(businessUnitId, settingCode);
    res.send(settingValue);
}

exports.getAllSettingsValues = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const businessUnitId = parseInt(req.params.id as string, 10);
    const data: Model<any, any>[] = [];
    const businessUnitSettings = await BusinessUnitSettingValue.findAll({
        where: {
            businessUnitId: businessUnitId,
        }
    });
    for (const businessUnitSettingValue of businessUnitSettings) {
        const settingValue = await getBusinessUnitSettingValue(businessUnitId, businessUnitSettingValue.dataValues.settingCode);
        data.push(settingValue);
    }
    res.send(data);
}

exports.getEmployeeAvailabilityForShift = async (req: pkg.Request, res: pkg.Response) => {
    //TODO - add types from other branch.
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const startTime: string = req.params.starttime;
    const endTime: string = req.params.endtime;
    const date: string = req.params.date;
    const position: number = parseInt(req.params.position, 10);
    const dateObject: Date = createDateFromString(date);
    const dayOfWeek: string = convertIntDayOfWeek(dateObject.getDay());
    const preferredEmployees = new Set<Model>();
    const availableEmployees = new Set<Model>();
    const notSpecifiedEmployees = new Set<Model>();
    const unavailableEmployees = new Set<Model>();

    const positionModel = await Position.findOne({
        where: { id: position },
        include: [{
            model: Employee,
            where: {
                currentlyEmployed: true,
                businessUnitId: id
            },
            include: [User]
        }],
        order: [[Employee, User, "lastName", 'desc']] //desc because pushing will invert to asc
    });
    if (!positionModel) {
        throw new NotFoundError("Position", position);
    }
    const employees = positionModel.dataValues.employees;
    for (const employeeModel of employees) {
        const employee = employeeModel.dataValues;
        const user = employee.user;

        //unavailable because of approved time off request
        const timeOffRequest = await TimeOffRequest.findOne({
            where: {
                requesterId: employee.id,
                startDate: { [Op.lte]: date },
                endDate: { [Op.gte]: date },
                approval: true
            }
        });
        if (timeOffRequest) {
            unavailableEmployees.add(employee);
            continue;
        }
        //check via availabilities now
        const availabilities = await AvailabilityTemplate.findAll({
            where: {
                userId: user.dataValues.id,
                semester: employee.semester,
                dayOfWeek: dayOfWeek
            }
        });
        const available = availabilities.filter(availabilities => availabilities.dataValues.preference !== "unavailable");
        const unavailable = availabilities.filter(availabilities => availabilities.dataValues.preference === "unavailable")
        let pushed = false;

        for (const unavailability of unavailable) {
            if (unavailability.dataValues.startTime < endTime && unavailability.dataValues.endTime > startTime) {
                unavailableEmployees.add(employee);
                pushed = true;
                break;
            }
        }
        if (!pushed) {
            const availability: AvailabilityPreference = checkAvailabilityOverlap(available, startTime, endTime, preferredEmployees, availableEmployees, employee);
            if (availability === "preferred") {
                preferredEmployees.add(employee);
                pushed = true;
            }
            else if (availability === "available") {
                availableEmployees.add(employee);
                pushed = true;
            }
        }
        if (preferredEmployees.has(employee) && availableEmployees.has(employee)) {
            availableEmployees.delete(employee);
        }
        if (!pushed) {
            notSpecifiedEmployees.add(employee);
        }
    }
    const responseObject = {
        "preferred": [...preferredEmployees],
        "available": [...availableEmployees],
        "not specified": [...notSpecifiedEmployees],
        "unavailable": [...unavailableEmployees]
    }
    res.send(responseObject);
}

function checkAvailabilityOverlap(
    availabilities: Model[],
    startTime: string,
    endTime: string,
    preferredEmployees: Set<Model>,
    availableEmployees: Set<Model>,
    employee: object
): AvailabilityPreference {
    //number of minutes between availabilitys allowed as overlap
    const GAP_MINUTES = 10;
    const toMinutes = (t: string): number => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };

    const shiftStart = toMinutes(startTime);
    const shiftEnd = toMinutes(endTime);
    //availbilities that are within the timeframe of the shift
    const relevant = availabilities
        .filter(a => {
            const bStart = toMinutes(a.dataValues.startTime);
            const bEnd = toMinutes(a.dataValues.endTime);
            return bStart < shiftEnd && bEnd > shiftStart;
        })
        .sort((a, b) =>
            toMinutes(a.dataValues.startTime) - toMinutes(b.dataValues.startTime)
        );

    if (!relevant.length) return "unavailable";

    // If any single preferred block fully covers the shift, preferred wins outright
    const preferredFullCover = relevant.some(a =>
        a.dataValues.preference === "preferred" &&
        toMinutes(a.dataValues.startTime) <= shiftStart &&
        toMinutes(a.dataValues.endTime) >= shiftEnd
    );

    let covered = shiftStart;
    let hasPreferred = false;
    let hasAvailable = false;

    for (const block of relevant) {
        const bStart = toMinutes(block.dataValues.startTime);
        const bEnd = toMinutes(block.dataValues.endTime);
        //gap too large, not considered overlapping
        if (bStart - covered > GAP_MINUTES) break;
        //extend cover to where availability ends
        if (bEnd > covered) {
            covered = bEnd;
            if (block.dataValues.preference === "preferred") hasPreferred = true;
            if (block.dataValues.preference === "available") hasAvailable = true;
        }
        //availability covers entire shift, stop checking.
        if (covered >= shiftEnd) {
            if (preferredFullCover || (hasPreferred && !hasAvailable)) {
                return "preferred";
            } else {
                return "available";
            }
        }
    }

    return "unavailable";
}

export default exports;
