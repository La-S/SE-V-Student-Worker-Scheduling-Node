import db from "../models/index.ts";
const Setting = db.Setting;

import { Model } from "sequelize";
import pkg from "express";
import { AppError } from "../error/app.error.ts";
import BusinessUnit, { BusinessUnitType } from "../models/businessunit.model.ts";
import BusinessUnitSettingValue from "../models/businessunitsettingvalue.model.ts";
import User, { UserType } from "../models/user.model.ts";
import UserSettingValue from "../models/usersettingvalue.model.ts";
import SettingIntMapping from "../models/settingintmapping.model.ts";
import { SettingType } from "../models/setting.model.ts";

const exports: any = {};

// Create a new setting
exports.create = async (req: pkg.Request, res: pkg.Response) => {

    req.body.id = undefined;

    const existing: SettingType | null = await Setting.findOne({
        where: { code: req.body.code }
    });

    if (existing) {
        throw new AppError(409, `Setting with code ${req.body.code} already exists`);
    }

    if (req.body.defaultValue === undefined) {
        throw new AppError(400, "defaultValue must be provided");
    }

    let typeDefined: boolean = false;
    let type: string = req.body.type;

    if (type === "int") {
        if (req.body.intMin == null || req.body.intMax == null) {
            throw new AppError(400, "intMin and intMax must be provided for int type settings");
        }
        if (req.body.intMax < req.body.intMin) {
            throw new AppError(400, "intMax must be greater than or equal to intMin");
        }
        if ((req.body.defaultValue < req.body.intMin || req.body.defaultValue > req.body.intMax)) {
            throw new AppError(400, `defaultValue must be between ${req.body.intMin} and ${req.body.intMax}`);
        }
        if (req.body.intMax && req.body.intMin && req.body.intMax < req.body.intMin) {
            throw new AppError(400, `intMax must be greater than or equal to intMin`);
        }
        typeDefined = true;
    }

    if (type === "boolean") {
        req.body.intMin = 0;
        req.body.intMax = 1;
        if (req.body.defaultValue == true) {
            req.body.defaultValue = 1;
        } else {
            req.body.defaultValue = 0;
        }
        typeDefined = true;
    }

    if (type === "string") {
        if (!req.body.values) {
            throw new AppError(400, "values must be provided for string type settings");
        }
        if (!req.body.values.includes(req.body.defaultValue)) {
            throw new AppError(400, "defaultValue must be one of the values provided in the values array");
        }
        req.body.defaultValue = req.body.values.indexOf(req.body.defaultValue);
        req.body.intMin = 0;
        req.body.intMax = req.body.values.length - 1;

        typeDefined = true;
    }

    if (!typeDefined) {
        throw new AppError(400, "type must be int, boolean, or string");
    }


    const data: SettingType = await Setting.create(req.body);
    if (type === "string") {
        for (let i = req.body.intMin; i <= req.body.intMax; i++) {
            await SettingIntMapping.create({
                settingCode: req.body.code,
                settingValue: i,
                stringValue: req.body.values[i - req.body.intMin]
            });
        }
    }
    if (req.body.isForBusinessUnit) {
        const businessUnits: BusinessUnitType[] = await BusinessUnit.findAll();
        for (const businessUnit of businessUnits) {
            await BusinessUnitSettingValue.create({
                businessUnitId: businessUnit.dataValues.id,
                settingCode: req.body.code,
                settingValue: req.body.defaultValue
            });
        }
    }
    //is for users
    else if (req.body.isForBusinessUnit == false) {
        const users: UserType[] = await User.findAll();
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

exports.findAll = async (req: pkg.Request, res: pkg.Response) => {

    const data: SettingType[] = await Setting.findAll({
        include: [{
            model: SettingIntMapping,
            required: false
        }],
        order: [["name", "ASC"]]
    });
    res.send(data);
}
// Find a single setting by code
exports.findOne = async (req: pkg.Request, res: pkg.Response) => {

    const code: string = req.params.code;

    const data: SettingType = await getSettingForCode(code);
    res.send(data);

};

// Update a setting by code
exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const code: string = req.params.code;
    const setting: SettingType = await getSettingForCode(code);
    req.body.id = undefined;
    req.body.code = undefined;

    let intMin: number = setting.dataValues.intMin;
    let intMax: number = setting.dataValues.intMax;
    let defaultValue: number = setting.dataValues.defaultValue;
    let type: string = setting.dataValues.type;
    if (req.body.intMin !== undefined){
        intMin = req.body.intMin;
    }
    if (req.body.intMax !== undefined){
        intMax = req.body.intMax;
    }
    if (req.body.defaultValue !== undefined){
        defaultValue = req.body.defaultValue;
    }
    if (req.body.type !== undefined){
        type = req.body.type;
    }

    if (intMax !== null && intMin !== null && intMax < intMin) {
        throw new AppError(400, `intMax must be greater than or equal to intMin`);
    }


    if (type === 'string') {
        if (!req.body.values || !Array.isArray(req.body.values)) {
            throw new AppError(400, 'values must be provided for string type settings');
        }
        req.body.intMin = 0;
        req.body.intMax = req.body.values.length - 1;

        if (defaultValue < 0 || defaultValue > req.body.intMax) {
            throw new AppError(400, `defaultValue must be between 0 and ${req.body.intMax}`);
        }

        await SettingIntMapping.destroy({ where: { settingCode: code } });
        for (let i = 0; i < req.body.values.length; i++) {
            await SettingIntMapping.create({
                settingCode: code,
                intValue: i,
                stringValue: req.body.values[i],
            });
        }
    } else {
        if (defaultValue < intMin || defaultValue > intMax) {
            throw new AppError(400, `defaultValue must be between ${intMin} and ${intMax}`);
        }
    }

    const numUpdated: number[] = await Setting.update(req.body, { where: { code } });
    if (numUpdated[0] <= 0) {
        throw new AppError(400, `Update Setting for code ${code} did not update.`);
    }

    const updatedObject: SettingType | null = await getSettingForCode(code);
    res.send(updatedObject);
};

// Delete a setting by code
exports.delete = async (req: pkg.Request, res: pkg.Response) => {

    const code: string = req.params.code;

    await getSettingForCode(code);

    const numDeleted: number = await Setting.destroy({
        where: { code: code }
    });

    if (numDeleted <= 0) {
        throw new AppError(400, `Delete for code ${code} failed.`);
    }

    res.send({ message: "Setting deleted successfully" });

};

// Helper function
async function getSettingForCode(code: string): Promise<SettingType> {

    if (!code) {
        throw new AppError(400, "code must be provided");
    }

    const data: SettingType | null = await Setting.findOne({
        where: { code },
        include: [{
            model: SettingIntMapping,
            required: false
        }]
    });

    if (!data) {
        throw new AppError(404, `Setting for code ${code} not found`);
    }

    return data;
}

export default exports;