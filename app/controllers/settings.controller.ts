import db from "../models/index.ts";
const Settings = db.Settings;

import { Model } from "sequelize";
import pkg from "express";
import { AppError } from "../error/app.error.ts";

const exports: any = {};

// Create a new setting
exports.create = async (req: pkg.Request, res: pkg.Response) => {

    req.body.id = undefined;

    const existing = await Settings.findOne({
        where: { code: req.body.code }
    });

    if (existing) {
        throw new AppError(409, `Setting with code ${req.body.code} already exists`);
    }

    const data = await Settings.create(req.body);
    res.send(data);
};

// Retrieve all settings
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

    const data = await Settings.findAll();
    res.send(data);

};

// Find a single setting by code
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {

    const code = req.params.code;

    const data = await getSettingsForCode(code);
    res.send(data);

};

// Update a setting by code
exports.update = async (req: pkg.Request, res: pkg.Response) => {

    const code = req.params.code;

    // throws error if not found
    await getSettingsForCode(code);

    req.body.id = undefined;
    req.body.code = undefined;

    const numUpdated = await Settings.update(req.body, {
        where: { code: code }
    });

    if (numUpdated[0] <= 0) {
        throw new AppError(400, `Update Settings for code ${code} did not update.`);
    }

    const updatedObject = await getSettingsForCode(code);

    res.send(updatedObject);
};

// Delete a setting by code
exports.delete = async (req: pkg.Request, res: pkg.Response) => {

    const code = req.params.code;

    await getSettingsForCode(code);

    const numDeleted = await Settings.destroy({
        where: { code: code }
    });

    if (numDeleted <= 0) {
        throw new AppError(400, `Delete for code ${code} failed.`);
    }

    res.send({ message: "Setting deleted successfully" });

};

// Helper function
async function getSettingsForCode(code: string): Promise<Model<any, any> | null> {

    if (!code) {
        throw new AppError(400, "code must be provided");
    }

    const data = await Settings.findOne({
        where: { code }
    });

    if (!data) {
        throw new AppError(404, `Setting for code ${code} not found`);
    }

    return data;
}

export default exports;