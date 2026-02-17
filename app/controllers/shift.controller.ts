import db from "../models/index.ts";
const Shift = db.Shift;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import User from "../models/user.model.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import { AppError } from "../error/app.error.ts";
import Employee from "../models/employee.model.ts";
import Position from "../models/position.model.ts";
import TaskCompletion from "../models/taskcompletion.model.ts";
import TaskList from "../models/tasklist.model.ts";
import Task from "../models/task.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";

const exports: any = {};
const errorClassName = "Shift";

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    const data = await getShiftForId(id);
    res.send(data);
};


async function getShiftForId(id: number): Promise<Model<any, any> | null> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data = await Shift.findByPk(id, { include: [{
        model: Employee,
        include: [User]
    },
    {
        model: Position
    },
    {
        model: TaskList,
        include: [{
            model: Task,
            include: [{
                model: TaskCompletion,
                where:{shiftId: id}
            }]
        }]
        model: Position,
    },
    {
        model: BusinessUnit
    }
]});
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}

export default exports;
