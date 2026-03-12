import pkg from 'express'
import Shift from "../models/shift.model.ts"
import BusinessUnit from '../models/businessunit.model.ts';
import { Model, Op } from 'sequelize';
import Employee from '../models/employee.model.ts';
import User from '../models/user.model.ts';
import Position from '../models/position.model.ts';
import TaskList from '../models/tasklist.model.ts';
import { createDateFromString, getOneForId, getStringFromDate } from '../services/services.ts';
import AvailabilityTemplate from '../models/availabilitytemplate.model.ts';
import WeeklyScheduleTemplate from '../models/weeklyscheduletemplate.model.ts';
import OpenHours from '../models/openhours.model.ts';
import { deleteShiftsForWeek } from './shift.controller.ts';
import { sendNotificationToBusinessUnit } from '../services/notifications.ts';
import { AppError } from "../error/app.error.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";
const exports: any = {}

exports.findShifts = async (req: pkg.Request, res: pkg.Response) => {

    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);
    const startDate = req.query.start;
    const endDate = req.query.end;
    let data = {};
    let includeCondition = [{
        model: Employee,
        include: [User]
    },
    {
        model: Position
    },
    {
        model: TaskList,
        as: "taskList"
    }]
    let whereCondition = {}
    //no date range, get all
    if (!startDate && !endDate) {
        whereCondition = {
            businessUnitId: id
        }
    }
    //no startDate, get all up to end
    else if (!startDate) {
        whereCondition = {
            businessUnitId: id,
            date: {
                [Op.lte]: endDate
            }
        }
    }
    //no end date, get all after start
    else if (!endDate) {
        whereCondition = {
            businessUnitId: id,
            date: {
                [Op.gte]: startDate
            }
        }
    }
    //both dates, get between them
    else {
        whereCondition = {
            businessUnitId: id,
            date: {
                [Op.between]: [startDate, endDate]
            }
        }
    }
    data = await Shift.findAll({ where: whereCondition, include: includeCondition });
    res.send(data);
};


exports.findTaskLists = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data = await TaskList.findAll({ where: { businessUnitId: id } });
    res.send(data);
}

exports.findEmployees = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data = await Employee.findAll({
        where: { businessUnitId: id },
        include: User
    });
    res.send(data);
}

exports.findPositions = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    const data = await Position.findAll({ where: { businessUnitId: id }, });
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

    const dayOfWeek = req.params.dayOfWeek as string;
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
    const businessUnit = await getOneForId(BusinessUnit, id);
    const data = await AvailabilityTemplate.findAll({
        include: [{
            model: User,
            required: true, //REQUIRED. DO NOT REMOVE
            include: [{
                model: Employee,
                where: { businessUnitId: id },
            }]
        }]
    })
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
                        startTime: {[Op.lte]: startTime},
                        endTime: {[Op.gte]: endTime}
                    },
                    //only users where their availability is "available" or "preferred". Unavailable assumed
                    preference: {[Op.in]: acceptablePreferences} 
                }
            }]
        }
    });

    res.send(availableEmployees);
}

exports.publishShiftsForWeek = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    const startDate = req.params.date as string;
    getOneForId(BusinessUnit, id);
    const startDateObject = createDateFromString(startDate);
    const endDateObject = new Date(startDateObject);
    endDateObject.setDate(endDateObject.getDate() +  6);
    const endDate = getStringFromDate(endDateObject);

    Shift.update({"published": true}, {where: 
        {
            businessUnitId: id,
            date: {[Op.between]: [startDate, endDate]}
        }
    });

    sendNotificationToBusinessUnit(id, startDate);

    res.send({message: "shifts published!"});
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
