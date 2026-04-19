import db from "../models/index.ts";
const Setting = db.Setting;

import { Model } from "sequelize";
import pkg from "express";
import { AppError } from "../error/app.error.ts";

const exports: any = {};

// Create a new setting
exports.create = async (req: pkg.Request, res: pkg.Response) => {

    req.body.id = undefined;

    const existing = await Setting.findOne({
        where: { code: req.body.code }
    });

    if (existing) {
        throw new AppError(409, `Setting with code ${req.body.code} already exists`);
    }

    const data = await Setting.create(req.body);
    res.send(data);
};

// Find a single setting by code
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {

    const code = req.params.code;

    const data = await getSettingForCode(code);
    res.send(data);

};

// Update a setting by code
exports.update = async (req: pkg.Request, res: pkg.Response) => {

    const code = req.params.code;

    // throws error if not found
    await getSettingForCode(code);

    req.body.id = undefined;
    req.body.code = undefined;

    const numUpdated = await Setting.update(req.body, {
        where: { code: code }
    });

    if (numUpdated[0] <= 0) {
        throw new AppError(400, `Update Setting for code ${code} did not update.`);
    }

    const updatedObject = await getSettingForCode(code);

    res.send(updatedObject);
};

// Delete a setting by code
exports.delete = async (req: pkg.Request, res: pkg.Response) => {

    const code = req.params.code;

    await getSettingForCode(code);

    const numDeleted = await Setting.destroy({
        where: { code: code }
    });

    if (numDeleted <= 0) {
        throw new AppError(400, `Delete for code ${code} failed.`);
    }

    res.send({ message: "Setting deleted successfully" });

};

// Helper function
async function getSettingForCode(code: string): Promise<Model<any, any> | null> {

    if (!code) {
        throw new AppError(400, "code must be provided");
    }

    const data = await Setting.findOne({
        where: { code }
    });

    if (!data) {
        throw new AppError(404, `Setting for code ${code} not found`);
    }

    return data;
}

export default exports;