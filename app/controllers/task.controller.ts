import db from "../models/index.ts";
const Task = db.Task;
const TaskList = db.TaskList;
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import { Model } from "sequelize";
import TaskCompletion, { type TaskCompletionType } from "../models/taskcompletion.model.ts";
import { type TaskType } from "../models/task.model.ts";
import { type ShiftType } from "../models/shift.model.ts";
import { type TaskListType } from "../models/tasklist.model.ts";
import { type TaskCompletionValuesType } from "../types/taskcompletion.type.ts";

const exports: any = {};
const errorClassName: string = "Task";

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const task: TaskType = await Task.create(req.body);
    const taskId: number = task.dataValues.id;
    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' })
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const taskList: TaskListType | null = await TaskList.findOne({ where: { id: task.dataValues.taskListId } });
    //despite the name, it returns multiple. getShifts doesnt exist.
    //@ts-ignore
    const shifts: ShiftType[] = await taskList!.getShift();
    const futureShifts: ShiftType[] = shifts.filter((shift) => (shift.dataValues.date > today) || (shift.dataValues.date == today && shift.dataValues.startTime >= currentTime));
    for (let shift of futureShifts) {
        const taskCompletion: TaskCompletionValuesType = {
            "checkedOff": false,
            "taskId": taskId,
            "shiftId": shift.dataValues.id
        }
        //@ts-ignore
        await TaskCompletion.create(taskCompletion);
    }
    res.send(task);
}

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(Task, id);

    //an employee should refer to a userId and businessUnitId, these should not change
    req.body.taskListId = undefined;
    req.body.id = undefined;

    const numUpdated: number[] = await Task.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedTask: TaskType = await getOneForId(Task, id);
    res.send(updatedTask);
};

export default exports;