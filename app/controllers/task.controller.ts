import db from "../models/index.ts";
const Task = db.Task;
const TaskList = db.TaskList;
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import { Model } from "sequelize";
import TaskCompletion from "../models/taskcompletion.model.ts";

const exports: any = {};
const errorClassName = "Task";

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const task = await Task.create(req.body);
    const taskId = task.id;

    const taskList = await TaskList.findOne({ where: { id: task.taskListId } });
    //despite the name, it returns multiple. getShifts doesnt exist.
    const shifts: Model<any, any>[] = await taskList!.getShift();
    for (let shift of shifts) {
        const taskCompletion = {
            "checkedOff": "false",
            "taskId": taskId,
            "shiftId": shift.dataValues.id
        }
        await TaskCompletion.create(taskCompletion);
    }
    res.send(task);
}

exports.update = async (req: pkg.Request, res: pkg.Response) => {
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
};

export default exports;