import pkg from 'express';
import { Op } from 'sequelize';
import { AppError } from "../error/app.error.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import OpenHours from "../models/openhours.model.ts";
import { getOneForId } from "../services/services.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";

const exports: any = {};
const errorClassName = "Open Hours";

// Create and Save new OpenHours
exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;

    const businessUnitId = parseInt(req.body.businessUnitId, 10);
    await getOneForId(BusinessUnit, businessUnitId);

    if (req.body.dayOfWeek !== undefined && !Number.isNaN(Number(req.body.dayOfWeek))) {
        const dayIndex = parseInt(req.body.dayOfWeek, 10);
        if (dayIndex < 0 || dayIndex > 7) {
            throw new AppError(400, "dayOfWeek must be an integer between 0 and 7");
        }
        req.body.dayOfWeek = daysOfWeek[dayIndex === 7 ? 6 : dayIndex];
    }

    const existingOpenHours = await OpenHours.findOne({
        where: {
            businessUnitId: businessUnitId,
            dayOfWeek: req.body.dayOfWeek,
        }
    });

    if (existingOpenHours) {
        throw new AppError(409, `Open hours already exists for ${req.body.dayOfWeek} in business unit ${businessUnitId}`);
    }

    const data = await OpenHours.create(req.body);
    res.send(data);
};

// Retrieve all OpenHours
exports.findAll = async (_req: pkg.Request, res: pkg.Response) => {
    const data = await OpenHours.findAll();
    res.send(data);
};

// Find a single OpenHours with an id
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const data = await getOneForId(OpenHours, id);
    res.send(data);
};

// Get all open hours for a business unit
exports.findForBusinessUnit = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    await getOneForId(BusinessUnit, id);

    const data = await OpenHours.findAll({
        where: { businessUnitId: id },
        order: [["dayOfWeek", "ASC"], ["startTime", "ASC"]]
    });

    res.send(data);
};

// Get open hours for a business unit and day
exports.findForBusinessUnitAndDay = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    await getOneForId(BusinessUnit, id);

    let dayOfWeek: string | number = req.params.dayOfWeek;
    if (dayOfWeek !== undefined && !Number.isNaN(Number(dayOfWeek))) {
        const dayIndex = parseInt(String(dayOfWeek), 10);
        if (dayIndex < 0 || dayIndex > 7) {
            throw new AppError(400, "dayOfWeek must be an integer between 0 and 7");
        }
        dayOfWeek = daysOfWeek[dayIndex === 7 ? 6 : dayIndex];
    }

    const data = await OpenHours.findAll({
        where: { businessUnitId: id, dayOfWeek },
        order: [["startTime", "ASC"]]
    });

    res.send(data);
};

// Update OpenHours by id
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const originalOpenHours = await getOneForId(OpenHours, id);

    // OpenHours should remain associated with original business unit
    req.body.id = undefined;
    req.body.businessUnitId = undefined;

    if (req.body.dayOfWeek !== undefined && !Number.isNaN(Number(req.body.dayOfWeek))) {
        const dayIndex = parseInt(req.body.dayOfWeek, 10);
        if (dayIndex < 0 || dayIndex > 7) {
            throw new AppError(400, "dayOfWeek must be an integer between 0 and 7");
        }
        req.body.dayOfWeek = daysOfWeek[dayIndex === 7 ? 6 : dayIndex];
    }

    const nextDay = req.body.dayOfWeek ?? originalOpenHours.get("dayOfWeek");

    const existingOpenHours = await OpenHours.findOne({
        where: {
            businessUnitId: originalOpenHours.get("businessUnitId"),
            dayOfWeek: nextDay,
            id: { [Op.ne]: id }
        }
    });

    if (existingOpenHours) {
        throw new AppError(409, `Open hours already exists for ${nextDay} in this business unit`);
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

// Delete OpenHours by id
exports.delete = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);

    await getOneForId(OpenHours, id);

    const numDeleted = await OpenHours.destroy({
        where: { id: id },
    });

    if (numDeleted <= 0) {
        throw new AppError(400, `Delete ${errorClassName} for id ${id} did not delete. Check request body.`);
    }

    res.status(200).send({ message: "Deleted successfully!" });
};

export default exports;
