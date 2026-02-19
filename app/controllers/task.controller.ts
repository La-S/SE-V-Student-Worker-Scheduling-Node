import db from "../models/index.ts";
const Task = db.Task;
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";

const exports: any = {};
const errorClassName = "Task";


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