import db from "../models/index.ts";
const UserSettingValue = db.UserSettingValue;
import { Model, Op } from 'sequelize';
import { type Request, type Response } from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId, getOneForStringId } from "../services/services.ts";
import Setting, { type SettingType } from "../models/setting.model.ts";
import { parse } from "node:path";
import SettingIntMapping, { type SettingIntMappingType } from "../models/settingintmapping.model.ts";
import User from "../models/user.model.ts";
import { type UserSettingValueType } from "../models/usersettingvalue.model.ts";


export async function create(req: Request, res: Response) {
    //throws error if not found
    const setting: SettingType = await getOneForStringId(Setting, req.body.settingCode);

    req.body.id = undefined;

    if (req.body.settingValue > setting.dataValues.intMax || req.body.settingValue < setting.dataValues.intMin) {
        throw new AppError(400, `settingValue must be between ${setting.dataValues.intMin} and ${setting.dataValues.intMax}`);
    }
    const data: UserSettingValueType = await UserSettingValue.create(req.body);
    res.send(data);
}

export async function update(req: Request, res: Response) {
    const id: number = parseInt(req.params.id, 10);
    //throws error if not found
    const userSettingValue: UserSettingValueType = await getOneForId(UserSettingValue, id);

    //Should not change the business unit or setting 
    req.body.userId = undefined;
    req.body.settingCode = undefined;
    req.body.id = undefined;

    const setting: SettingType = await getOneForStringId(Setting, userSettingValue.dataValues.settingCode);

    if (setting.dataValues.type === "string" && typeof req.body.settingValue == "string") {
        const settingIntMapping: SettingIntMappingType | null = await SettingIntMapping.findOne({ where: { settingCode: setting.dataValues.code, stringValue: req.body.settingValue } });
        if (!settingIntMapping) {
            throw new AppError(400, `Setting mapping for ${req.body.settingValue} not found`);
        }
        req.body.settingValue = settingIntMapping.dataValues.settingValue;
    }


    if (req.body.settingValue > setting.dataValues.intMax || req.body.settingValue < setting.dataValues.intMin) {
        throw new AppError(400, `settingValue must be between ${setting.dataValues.intMin} and ${setting.dataValues.intMax}`);
    }


    const numUpdated: number[] = await UserSettingValue.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedUserSettingValue: UserSettingValueType = await getOneForId(UserSettingValue, id);
    res.send(updatedUserSettingValue);
}

export async function findOne(req: Request, res: Response) {
    const id: number = parseInt(req.params.id, 10);
    const userSettingValue: UserSettingValueType = await getOneForId(UserSettingValue, id);
    //@ts-ignore will not be null because of error thrown in getOneForId if not found
    const data: UserSettingValueType = await UserSettingValue.findOne({
        where: { id: id },
        include: [
            {
                model: Setting,
                include: [{
                    model: SettingIntMapping,
                    required: false,
                    where: { settingValue: userSettingValue.dataValues.settingValue }
                }]
            }]
    });
    return data;
}


export async function getUserSettingValue(userId: number, settingCode: string): Promise<UserSettingValueType> {
    const userSettingValue: UserSettingValueType | null = await UserSettingValue.findOne({
        where: {
            userId: userId,
            settingCode: settingCode
        }
    });
    if (!userSettingValue) {
        throw new AppError(404, `No setting value found for user ${userId} and setting code ${settingCode}`);
    }
    const settingValue: UserSettingValueType | null = await UserSettingValue.findOne({
        where: {
            userId: userId,
            settingCode: settingCode
        },
        include: [{
            model: Setting,
            include: [{
                model: SettingIntMapping,
                required: false,
                where: { settingValue: userSettingValue.dataValues.settingValue }
            }]

        }]
    });
    return settingValue!;
}

