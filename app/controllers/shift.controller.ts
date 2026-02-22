import db from "../models/index.ts";
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { NotFoundError } from "../error/notfound.error.ts";
import { AppError } from "../error/app.error.ts";
const { Shift, TaskList, User, Position, TaskCompletion, Task, Employee } = db;


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
    const data = await Shift.findByPk(id, {
        include: [{
            model: Employee,
            include: [User]
        },
        {
            model: Position
        },
        {
            model: TaskList,
            as: "taskList",
            include: [{
                model: Task,
                include: [{
                    model: TaskCompletion,
                    where: { shiftId: id },
                    required: false,
                    include: [
                        {
                            model: Employee,
                            include: [User]
                        }
                    ]
                }]
            }]
        }
        ]
    });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
};

exports.addTaskList = async (req: pkg.Request, res: pkg.Response) => {
    const shiftId = parseInt(req.params.id, 10);
    const taskListId = parseInt(req.params.tasklistid, 10)

    const shift = await Shift.findByPk(shiftId);
    if (!shift) {
        throw new NotFoundError(errorClassName, shiftId);
    }
    const taskList = await TaskList.findByPk(taskListId);
    if (!taskList) {
        throw new NotFoundError("Task List", taskListId);
    }
    //@ts-ignore
    const data = await shift.addTaskList(taskList);
    if (!data) {
        res.status(400).send({ message: "Something went wrong adding task list" });
        return;
    }
    const tasks = await taskList.getTasks();
    for (let task of tasks) {
        const taskCompletion = {
            "checkedOff": "false",
            "taskId": task.id,
            "shiftId": shift.dataValues.id
        }
        await TaskCompletion.create(taskCompletion);
    }
    res.send({ message: "Task List added successfully" });

}


exports.removeTaskList = async (req: pkg.Request, res: pkg.Response) => {
    const shiftId = parseInt(req.params.id, 10);
    const taskListId = parseInt(req.params.tasklistid, 10)

    const shift = await Shift.findByPk(shiftId);
    if (!shift) {
        throw new NotFoundError(errorClassName, shiftId);
    }
    const taskList = await TaskList.findByPk(taskListId);
    if (!taskList) {
        throw new NotFoundError("Task List", taskListId);
    }
    //@ts-ignore
    const data = await shift.removeTaskList(taskList);
    if (data != 1) {
        res.status(400).send("Something went wrong removing task list")
    }
    else {
        res.send({ message: "Task List removed successfully" });
    }
}

export default exports;
