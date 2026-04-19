import db from "../models/index.ts";
const Setting = db.Setting;

import { Model } from "sequelize";
import pkg from "express";
import { AppError } from "../error/app.error.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import BusinessUnitSettingValue from "../models/businessunitsettingvalue.model.ts";
import User from "../models/user.model.ts";
import UserSettingValue from "../models/usersettingvalue.model.ts";

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

    let typeDefined: boolean = false;
    let type: string = req.body.type;
    if (type === "int") {
        if (!req.body.intMin || !req.body.intMax) {
            throw new AppError(400, "intMin and intMax must be provided for int type settings");
        }
        if (req.body.intMax < req.body.intMin) {
            throw new AppError(400, "intMax must be greater than or equal to intMin");
        }
        typeDefined = true;
    }

    if (type === "boolean") {
        req.body.intMin = 0;
        req.body.intMax = 1;
        typeDefined = true;
    }

    if (type === "string") {
        if (!req.body.values) {
            throw new AppError(400, "values must be provided for string type settings");
        }
        req.body.intMin = 0;
        req.body.intMax = req.body.values.length - 1;
        typeDefined = true;
    }

    if (!typeDefined) {
        throw new AppError(400, "type must be int, boolean, or string");
    }


    const data = await Setting.create(req.body);
    if (type === "string") {
        for (let i = req.body.intMin; i <= req.body.intMax; i++) {
            await db.SettingIntMapping.create({
                settingCode: req.body.code,
                intValue: i,
                stringValue: req.body.values[i - req.body.intMin]
            });
        }
    }
    if (req.body.isForBusinessUnit) {
        const businessUnits = await BusinessUnit.findAll();
        for (const businessUnit of businessUnits) {
            await BusinessUnitSettingValue.create({
                businessUnitId: businessUnit.dataValues.id,
                settingCode: req.body.code,
                settingValue: req.body.defaultValue
            });
        }
    }
    //is for users
    else if (req.body.isForBusinessUnit != null) {
        const users = await User.findAll();
        for (const user of users) {
            await UserSettingValue.create({
                userId: user.dataValues.id,
                settingCode: req.body.code,
                settingValue: req.body.defaultValue
            });
        }
    }
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
    const setting = await getSettingForCode(code);

    req.body.id = undefined;
    req.body.code = undefined;
    if (req.body.defaultValue !== undefined && (req.body.defaultValue < setting.dataValues.intMin || req.body.defaultValue > setting.dataValues.intMax)) {
        throw new AppError(400, `defaultValue must be between ${setting.dataValues.intMin} and ${setting.dataValues.intMax}`);
    }
    if (req.body.intMax > req.body.defaultValue || req.body.intMin < req.body.defaultValue) {
        throw new AppError(400, `defaultValue must be between intMin and intMax. Please update the defaultValue.`);
    }
    if (req.body.intMax && req.body.intMin && req.body.intMax < req.body.intMin) {
        throw new AppError(400, `intMax must be greater than or equal to intMin`);
    }

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