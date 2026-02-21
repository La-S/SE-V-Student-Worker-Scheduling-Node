import db from "../models/index.ts";
const AvailabilityTemplate = db.AvailabilityTemplate;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";

const exports: any = {};

// Update a Employee by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(AvailabilityTemplate, id);

    //No reason to change the availability user
    req.body.userId = undefined;
    req.body.id = undefined;

    const numUpdated = await AvailabilityTemplate.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedAvailabilityTemplate = await getOneForId(AvailabilityTemplate, id);
    res.send(updatedAvailabilityTemplate);
};

export default exports;