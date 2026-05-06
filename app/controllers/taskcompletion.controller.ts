import db from "../models/index.ts";
const TaskCompletion = db.TaskCompletion;
import { type Request, type Response } from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import { Model } from "sequelize";
import Task from "../models/task.model.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import Employee from "../models/employee.model.ts";

const errorClassName = "TaskCompletion";


export async function findOne(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);

    const data = await getTaskCompletionForId(id);
    res.send(data);
}

export async function update(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(TaskCompletion, id);

    //no reason to update taskId. updating shiftId makes sense when reloading from template.
    req.body.taskId = undefined;
    req.body.id = undefined;

    const numUpdated = await TaskCompletion.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedEmployee = await getOneForId(TaskCompletion, id);
    res.send(updatedEmployee);
}


async function getTaskCompletionForId(id: number): Promise<Model<any, any> | null> {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data = await TaskCompletion.findByPk(id, { include: [Task, Employee] });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}

