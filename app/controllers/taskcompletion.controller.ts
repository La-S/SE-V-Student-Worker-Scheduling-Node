import db from "../models/index.ts";
const TaskCompletion = db.TaskCompletion;
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import { Model } from "sequelize";
import Task from "../models/task.model.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import Employee from "../models/employee.model.ts";
import { type TaskCompletionType } from "../models/taskcompletion.model.ts";

const exports: any = {};
const errorClassName: string = "TaskCompletion";


exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);

    const data: TaskCompletionType = await getTaskCompletionForId(id);
    res.send(data);
};

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(TaskCompletion, id);

    //no reason to update taskId. updating shiftId makes sense when reloading from template.
    req.body.taskId = undefined;
    req.body.id = undefined;

    const numUpdated: number[] = await TaskCompletion.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedEmployee: TaskCompletionType = await getOneForId(TaskCompletion, id);
    res.send(updatedEmployee);
};


async function getTaskCompletionForId(id: number): Promise<TaskCompletionType> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data: TaskCompletionType | null = await TaskCompletion.findByPk(id, { include: [Task, Employee] });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}

export default exports;