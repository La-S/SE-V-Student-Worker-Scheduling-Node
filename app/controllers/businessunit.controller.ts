import pkg from 'express'
import Shift from "../models/shift.model.ts"
import BusinessUnit from '../models/businessunit.model.ts';
import { Model, Op } from 'sequelize';
import Employee from '../models/employee.model.ts';
import User from '../models/user.model.ts';
import Position from '../models/position.model.ts';
import TaskList from '../models/tasklist.model.ts';
import { getOneForId } from '../services/services.ts';
import AvailabilityTemplate from '../models/availabilitytemplate.model.ts';
import WeeklyScheduleTemplate from '../models/weeklyscheduletemplate.model.ts';
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

    const data = await Position.findAll({ where: { businessUnitId: id },});
    res.send(data);
}

exports.findWeeklySchedules = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id as string, 10);
    await getOneForId(BusinessUnit, id);

    //I dont think this should include dailyschedules and shifts when getting all but lmk if you disagree
    const data = await WeeklyScheduleTemplate.findAll({ where: { businessUnitId: id },});
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

    const allEmployees = await Employee.findAll({
        where: { businessUnitId: id },
        include: User
    });
    const unavailableEmployees = await Employee.findAll({
        where: { businessUnitId: id },
        include: {
            model: User,
            required: true,
            include: [{
                model: AvailabilityTemplate,
                where: {
                    dayOfWeek: dayOfWeek,
                    [Op.or]: {
                        startTime: {[Op.lte]: startTime},
                        endTime: {[Op.gte]: endTime}
                    },
                    preference: "unavailable"
                }
            }]
        }
    });

    const unavailableEmployeeIds = unavailableEmployees.map((employee) => {
        return employee.dataValues.id;
    })
    //get all employees that aren't unavailable
    let availableEmployees = allEmployees.map((employee) => {
        if (!unavailableEmployeeIds.includes(employee.dataValues.id))
            return employee;
    });
    availableEmployees = availableEmployees.filter((employee) => employee !== undefined);

    res.send(availableEmployees);
}

export default exports;
