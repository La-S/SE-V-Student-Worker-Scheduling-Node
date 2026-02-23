import db from "../models/index.ts";
const Employee = db.Employee;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import WeeklyScheduleTemplate from "../models/weeklyscheduletemplate.model.ts";
import { getOneForId } from "../services/services.ts";
import Shift from "../models/shift.model.ts";
import User from "../models/user.model.ts";
import Position from "../models/position.model.ts";
import DailyScheduleTemplate from "../models/dailyscheduletemplate.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";

const exports: any = {};
const errorClassName = "Weekly Schedule Template";

// Find a single User with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data = await WeeklyScheduleTemplate.findByPk(id,
        {
            include:
                [{
                    model: DailyScheduleTemplate,
                    include: [{
                        model: Shift,
                        include: [{
                            model: Employee,
                            include: [User]
                        },
                        {
                            model: Position
                        }]
                    },]
                }]
        });
    res.send(data);
};

// Update a Employee by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(WeeklyScheduleTemplate, id);

    //No reason it should change to a different business
    req.body.businessUnitId = undefined;
    req.body.id = undefined;

    const numUpdated = await WeeklyScheduleTemplate.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedWeeklySchedule = await getOneForId(WeeklyScheduleTemplate, id);
    res.send(updatedWeeklySchedule);
};

exports.createFromShifts = async (req: pkg.Request, res: pkg.Response) => {
    const businessUnitId : number = req.body.businessUnitId;
    const startDate : string = req.body.startDate;
    const name: String = req.body.name;

    const shiftsForWeek : Model<any,any>[][] = []
    let currentDay: Date = new Date(startDate);

    await getOneForId(BusinessUnit, businessUnitId);
    const weeklyScheduleBody = {
        "name": name,
        "businessUnitId": businessUnitId
    }
    const weeklyScheduleTemplate = await WeeklyScheduleTemplate.create(weeklyScheduleBody);
    const weeklyScheduleTemplateId = weeklyScheduleTemplate.dataValues.id

    for (let day = 0; day < 7; day++){
        //formats to yyyy-mm-dd
        const dateFormatted = currentDay.toISOString().split('T')[0]
        const dayOfWeek = daysOfWeek[day];
        const dailyScheduleTemplateBody = {
            weeklyScheduleTemplateId: weeklyScheduleTemplateId,
            dayOfWeek: dayOfWeek
        }
        const dailyScheduleTemplate = await DailyScheduleTemplate.create(dailyScheduleTemplateBody);
        const dailyScheduleTemplateId = dailyScheduleTemplate.id;

        const shiftsForDay = await Shift.findAll({
            where:{
                businessUnitId: businessUnitId,
                date: dateFormatted
            }
        });
        //maintain startTime, endTime, businessUnitId, employeeId, positionId
        shiftsForDay.forEach(async (shift) => {
            const shiftValues = {...shift.dataValues};
            shiftValues.id = undefined;
            shiftValues.date = null;
            shiftValues.dailyScheduleTemplateId = dailyScheduleTemplateId;
            shiftValues.createdAt = undefined;
            shiftValues.updatedAt = undefined;
            shiftValues.published = false;
            const newShift = await Shift.create(shiftValues);
            //despite the name it returns multiple. Sequelize-made, cannot change
            const taskLists = await shift.getTaskList();
            taskLists.forEach((taskList) =>{
                taskList.addShift(newShift);
            })
        })
        //increment day by one, full week
        currentDay.setDate(currentDay.getDate() +1 );
    };
    res.send(weeklyScheduleTemplate);

}

export default exports;
