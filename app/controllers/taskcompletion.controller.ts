import db from "../models/index.ts";
const TaskCompletion = db.TaskCompletion;
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";

const exports: any = {};
const errorClassName = "TaskCompletion";


exports.update = async (req: pkg.Request, res: pkg.Response) => {
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
};

export default exports;