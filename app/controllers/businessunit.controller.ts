import { type Request, type Response } from 'express';
import Shift, { type ShiftType } from "../models/shift.model.ts"
import BusinessUnit, { type BusinessUnitType } from '../models/businessunit.model.ts';
import { Model, Op } from 'sequelize';
import Employee, { type EmployeeType } from '../models/employee.model.ts';
import User from '../models/user.model.ts';
import Position, { type PositionType } from '../models/position.model.ts';
import TaskList, { type TaskListType } from '../models/tasklist.model.ts';
import { createDateFromString, getDateRange, getOneForId, getOneForStringId, getStringFromDate, incrementSemester } from '../services/services.ts';
import AvailabilityTemplate, { type AvailabilityTemplateType } from '../models/availabilitytemplate.model.ts';
import WeeklyScheduleTemplate, { type WeeklyScheduleTemplateType } from '../models/weeklyscheduletemplate.model.ts';
import OpenHours, { type OpenHoursType } from '../models/openhours.model.ts';
import { deleteShiftsForWeek as doDeleteShiftsForWeek } from './shift.controller.ts';
import { sendNotificationToBusinessUnit } from '../services/notifications.ts';
import { sendEmailToBusinessUnit } from '../services/mailer.ts';
import { AppError } from "../error/app.error.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";
import CoverRequest, { type CoverRequestType } from '../models/coverrequest.model.ts';
import DropRequest, { type DropRequestType } from '../models/droprequest.model.ts';
import Timeclock from '../models/timeclock.model.ts';
import { getBudgetInformationForDateRange as doGetBudgetInformationForDateRange, loadEmployeeClassUnavailability } from './employee.controller.ts';
import { getBusinessUnitSettingValue } from './businessunitsettingvalue.controller.ts';
import SettingIntMapping from '../models/settingintmapping.model.ts';
import Setting, { type SettingType } from '../models/setting.model.ts';
import BusinessUnitSettingValue, { type BusinessUnitSettingValueType } from '../models/businessunitsettingvalue.model.ts';
import { get } from 'node:http';
import TimeOffRequest, { type TimeOffRequestType } from '../models/timeoffrequest.model.ts';


export async function create(req: Request, res: Response) {
    req.body.id = undefined;
    const data: BusinessUnitType = await BusinessUnit.create(req.body);
    const settings: SettingType[] = await Setting.findAll({ where: { isForBusinessUnit: true } });
    for (const setting of settings) {
        await BusinessUnitSettingValue.create({
            businessUnitId: data.dataValues.id,
            settingCode: setting.dataValues.code,
            settingValue: setting.dataValues.defaultValue
        });
    }
    res.send(data);
}

export async function findShifts(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const startDate: string = req.query.start as string;
    const endDate: string = req.query.end as string;
    const includeCondition = [
        { model: Employee, include: [User] },
        { model: Position },
        { model: TaskList, as: "taskList" },
        { model: Timeclock }
    ];
    const data: ShiftType[] = await Shift.findAll({
        where: { businessUnitId: id, ...getDateRange(startDate, endDate) },
        include: includeCondition
    });
    res.send(data);
}


export async function findTaskLists(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data: TaskListType[] = await TaskList.findAll({ where: { businessUnitId: id } });
    res.send(data);
}

export async function findCurrentEmployees(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data: EmployeeType[] = await Employee.findAll({
        where: { businessUnitId: id, currentlyEmployed: true },
        order: [[User, "lastName", "asc"]],
        include: User,
    });
    res.send(data);
}

export async function findAllEmployees(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data: EmployeeType[] = await Employee.findAll({
        where: { businessUnitId: id },
        order: [[User, "lastName", "asc"]],
        include: User,
    });
    res.send(data);
}

export async function findPositions(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data: PositionType[] = await Position.findAll({ where: { businessUnitId: id }, order: [["name", "asc"]] });
    res.send(data);
}

export async function findWeeklySchedules(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    //I dont think this should include dailyschedules and shifts when getting all but lmk if you disagree
    const data: WeeklyScheduleTemplateType[] = await WeeklyScheduleTemplate.findAll({ where: { businessUnitId: id }, });
    res.send(data);
}

export async function findOpenHours(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data: OpenHoursType[] = await OpenHours.findAll({
        where: { businessUnitId: id },
        order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]]
    });
    res.send(data);
}

export async function findOpenHoursForDay(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const dayInput: string = req.params.dayOfWeek as string;
    const dayIndex: number = Number(dayInput);
    const dayOfWeek: string = Number.isInteger(dayIndex) && dayIndex >= 1 && dayIndex <= daysOfWeek.length
        ? daysOfWeek[dayIndex - 1]
        : dayInput as string;

    if (!daysOfWeek.includes(dayOfWeek as typeof daysOfWeek[number])) {
        throw new AppError(400, `dayOfWeek must be one of: ${daysOfWeek.join(", ")}`);
    }

    const data: OpenHoursType[] = await OpenHours.findAll({
        where: { businessUnitId: id, dayOfWeek },
        order: [["startTime", "ASC"]]
    });
    res.send(data);
}

export async function findAvailabilityTemplates(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    const businessUnit: BusinessUnitType = await getOneForId(BusinessUnit, id);
    const employees: EmployeeType[] = await Employee.findAll({ where: { businessUnitId: id, currentlyEmployed: true } });
    let currentSemester: string | null = null;
    //if not defined in request, get the current semester and increment it (FA26 -> SP27)
    if (!currentSemester) {
        currentSemester = getMostCommonSemester(employees);
    }
    const data: AvailabilityTemplateType[] = await AvailabilityTemplate.findAll({
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
export async function findAvailabilityForDate(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    const businessUnit: BusinessUnitType = await getOneForId(BusinessUnit, id);
    const date: string | undefined = req.query.date as string; //not required
    const dayOfWeek: string | undefined = req.query.dayofweek as string; //maybe required?
    const startTime: string | undefined = req.query.start as string; //required
    const endTime: string | undefined = req.query.end as string; //required
    const acceptablePreferences: string[] = ["available", "preferred"];

    const allEmployees: EmployeeType[] = await Employee.findAll({
        where: { businessUnitId: id },
        include: User
    });
    const availableEmployees: EmployeeType[] = await Employee.findAll({
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

export async function publishShiftsForWeek(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    const startDate: string = req.params.date as string;
    await getOneForId(BusinessUnit, id);
    const startDateObject: Date = createDateFromString(startDate);
    const endDateObject: Date = new Date(startDateObject);
    endDateObject.setDate(endDateObject.getDate() + 6);
    const endDate: string = getStringFromDate(endDateObject);

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

export async function getCoverRequests(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const startDate: string | undefined = req.query.start as string;
    const endDate: string | undefined = req.query.end as string;
    const dateRange: { [key: string]: unknown } = getDateRange(startDate, endDate);
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
    const data: CoverRequestType[] = await CoverRequest.findAll({
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}

export async function getUpcomingOpenCoverRequests(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
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

export async function getDropRequests(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const startDate: string | undefined = req.query.start as string;
    const endDate: string | undefined = req.query.end as string;
    const dateRange: { [key: string]: unknown } = getDateRange(startDate, endDate);
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
    const data: DropRequestType[] = await DropRequest.findAll({
        include: includeCondition,
        order: [[Shift, "date", "asc"], [Shift, "startTime", "asc"]]
    });
    res.send(data);
}

export async function deleteShiftsForWeek(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    const dateString: string = req.params.date;
    const startDate: Date = createDateFromString(dateString);
    doDeleteShiftsForWeek(startDate, id);
    res.send({ message: "Shifts cleared" });
}

export async function getUpcomingOpenDropRequests(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
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

export async function findOpenShifts(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    const includeCondition = [
        { model: Employee, include: [User] },
        { model: Position },
        { model: TaskList, as: "taskList" }
    ];
    const data: ShiftType[] = await Shift.findAll({
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
}

export async function getBudgetInformationForDateRange(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    const startDate: string = req.query.start as string;
    const endDate: string = req.query.end as string;
    await getOneForId(BusinessUnit, id);
    const employees: EmployeeType[] = await Employee.findAll({ where: { businessUnitId: id, currentlyEmployed: true } });
    if (employees.length == 0) {
        throw new AppError(400, "No employees currently employed for business");
    }
    const returnObject: any[] = [];
    for (const employee of employees) {
        const employeeId: number = employee.dataValues.id;
        const employeeInfo = await (doGetBudgetInformationForDateRange(employeeId, startDate, endDate));
        returnObject.push(employeeInfo);
    }
    res.send(returnObject);
}

export async function rolloverEmployees(req: Request, res: Response) {
    const id: number = parseInt(req.params.id, 10);
    const businessUnit: BusinessUnitType = await getOneForId(BusinessUnit, id);
    const employees: EmployeeType[] = await Employee.findAll({ where: { businessUnitId: id, currentlyEmployed: true } });
    let loadClasses: boolean = req.query.loadclasses === "true";
    let semester: string = req.query.semester as string;
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
    let mostCommonSemester: string = "";
    let mostCommonSemesterCount: number = 0;
    semesters.forEach((value, key) => {
        if (value > mostCommonSemesterCount) {
            mostCommonSemesterCount = value;
            mostCommonSemester = key;
        }
    })
    return mostCommonSemester;
}

export async function getAllTimeOffRequests(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const includeCondition: any[] = [
        { model: Employee, as: "timeOffRequester", include: [User], where: { businessUnitId: id } },
        { model: Employee, as: "timeOffReviewer", required: false, include: [User], where: { businessUnitId: id } },
    ];
    const data: TimeOffRequestType[] = await TimeOffRequest.findAll({
        include: includeCondition,
        order: [["startDate", "asc"]]
    });
    res.send(data);
}

export async function getTimeOffRequestsDateRange(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const dateRangeStart: string = req.params.start;
    const dateRangeEnd: string = req.params.end;
    const includeCondition: any[] = [
        { model: Employee, as: "timeOffRequester", include: [User], where: { businessUnitId: id } },
        { model: Employee, as: "timeOffReviewer", required:false, include: [User], where: { businessUnitId: id } },
    ];
    const data: TimeOffRequestType[] = await TimeOffRequest.findAll({
        include: includeCondition,
        where: { startDate: { [Op.lte]: dateRangeEnd }, endDate: { [Op.gte]: dateRangeStart } },
        order: [["startDate", "asc"]]
    });
    res.send(data);
}

export async function getUpcomingOpenTimeOffRequests(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    const business: BusinessUnitType = await getOneForId(BusinessUnit, id);
    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const timeOffRequestsWithShifts = [];
    //@ts-ignore
    const employees: EmployeeType[] = await business.getEmployees();
    const employeeIds: number[] = employees.map((employee: EmployeeType) => { return employee.dataValues.id });
    const timeOffRequests: TimeOffRequestType[] = await TimeOffRequest.findAll({
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

export async function getSingleSettingValue(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    await getOneForStringId(Setting, req.params.code);
    const businessUnitId: number = parseInt(req.params.id as string, 10);
    const settingCode: string = req.params.code as string;
    const settingValue: BusinessUnitSettingValueType = await getBusinessUnitSettingValue(businessUnitId, settingCode);
    res.send(settingValue);
}

export async function getAllSettingsValues(req: Request, res: Response) {
    const id: number = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const businessUnitId: number = parseInt(req.params.id as string, 10);
    const data: BusinessUnitSettingValueType[] = [];
    const businessUnitSettings: BusinessUnitSettingValueType[] = await BusinessUnitSettingValue.findAll({
        where: {
            businessUnitId: businessUnitId,
        }
    });
    for (const businessUnitSettingValue of businessUnitSettings) {
        const settingValue: BusinessUnitSettingValueType = await getBusinessUnitSettingValue(businessUnitId, businessUnitSettingValue.dataValues.settingCode);
        data.push(settingValue);
    }
    res.send(data);
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

