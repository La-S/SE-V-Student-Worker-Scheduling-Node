import db from "../models/index.ts";
const Task = db.Task;
const TaskList = db.TaskList;
import { type Request, type Response } from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import { Model } from "sequelize";
import TaskCompletion from "../models/taskcompletion.model.ts";

const errorClassName = "Task";

export async function create(req: Request, res: Response) {
    req.body.id = undefined;
    const task = await Task.create(req.body);
    const taskId = task.id;
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const taskList = await TaskList.findOne({ where: { id: task.taskListId } });
    //despite the name, it returns multiple. getShifts doesnt exist.
    const shifts: Model<any, any>[] = await taskList!.getShift();
    const futureShifts = shifts.filter((shift) => (shift.dataValues.date > today) || (shift.dataValues.date == today && shift.dataValues.startTime >= currentTime));
    for (let shift of futureShifts) {
        const taskCompletion = {
            "checkedOff": "false",
            "taskId": taskId,
            "shiftId": shift.dataValues.id
        }
        await TaskCompletion.create(taskCompletion);
    }
    res.send(task);
}

export async function update(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(Task, id);

    //an employee should refer to a userId and businessUnitId, these should not change
    req.body.taskListId = undefined;
    req.body.id = undefined;

    const numUpdated = await Task.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedTask = await getOneForId(Task, id);
    res.send(updatedTask);
}

