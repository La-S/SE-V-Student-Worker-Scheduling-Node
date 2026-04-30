import db from "../models/index.ts";
const TaskList = db.TaskList;
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import Task from "../models/task.model.ts";
import { Model } from "sequelize";
import { NotFoundError } from "../error/notfound.error.ts";
import { TaskListType } from "../models/tasklist.model.ts";

const exports: any = {};
const errorClassName: string = "Task List";


exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);

    const data: TaskListType = await getTaskListForId(id);
    res.send(data);
};

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(TaskList, id);

    //No reason to update businessUnitId
    req.body.businessUnitId = undefined;
    req.body.id = undefined;

    const numUpdated: number[] = await TaskList.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedEmployee: TaskListType = await getOneForId(TaskList, id);
    res.send(updatedEmployee);
};

async function getTaskListForId(id: number): Promise<TaskListType> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data: TaskListType | null = await TaskList.findByPk(id, { include: [Task] });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}

export default exports;