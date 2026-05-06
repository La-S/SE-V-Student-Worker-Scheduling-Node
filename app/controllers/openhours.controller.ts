import { type Request, type Response } from 'express';
import { AppError } from "../error/app.error.ts";
import OpenHours from "../models/openhours.model.ts";
import { getOneForId } from "../services/services.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";

const errorClassName = "Open Hours";


// Update OpenHours by id
export async function update(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    const originalOpenHours = await getOneForId(OpenHours, id);

    // OpenHours should remain associated with original business unit
    req.body.id = undefined;
    req.body.businessUnitId = undefined;

    if (req.body.dayOfWeek !== undefined) {
        const dayInput = req.body.dayOfWeek;
        const dayIndex = Number(dayInput);
        const dayOfWeek = Number.isInteger(dayIndex) && dayIndex >= 1 && dayIndex <= daysOfWeek.length
            ? daysOfWeek[dayIndex - 1]
            : dayInput as string;

        if (!daysOfWeek.includes(dayOfWeek as typeof daysOfWeek[number])) {
            throw new AppError(400, `dayOfWeek must be one of: ${daysOfWeek.join(", ")}`);
        }
        req.body.dayOfWeek = dayOfWeek;
    }

    const numUpdated = await OpenHours.update(req.body, {
        where: { id: id },
    });

    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update ${errorClassName} for id ${id} did not update. Check request body.`);
    }

    const updatedOpenHours = await getOneForId(OpenHours, id);
    res.send(updatedOpenHours);
}


