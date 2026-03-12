import pkg from 'express';
import { Op } from 'sequelize';
import { AppError } from "../error/app.error.ts";
import OpenHours from "../models/openhours.model.ts";
import { getOneForId } from "../services/services.ts";

const exports: any = {};
const errorClassName = "Open Hours";


// Update OpenHours by id
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const originalOpenHours = await getOneForId(OpenHours, id);

    // OpenHours should remain associated with original business unit
    req.body.id = undefined;
    req.body.businessUnitId = undefined;

    if (req.body.dayOfWeek !== undefined) {
        const dayIndex = Number(req.body.dayOfWeek);
        if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
            throw new AppError(400, "dayOfWeek must be an integer between 0 and 6");
        }
        req.body.dayOfWeek = dayIndex;
    }

    const numUpdated = await OpenHours.update(req.body, {
        where: { id: id },
    });

    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update ${errorClassName} for id ${id} did not update. Check request body.`);
    }

    const updatedOpenHours = await getOneForId(OpenHours, id);
    res.send(updatedOpenHours);
};


export default exports;
