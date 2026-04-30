import db from "../models/index.ts";
const BusinessUnitSettingValue = db.BusinessUnitSettingValue;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId, getOneForStringId } from "../services/services.ts";
import Setting, { SettingType } from "../models/setting.model.ts";
import { parse } from "node:path";
import SettingIntMapping, { SettingIntMappingType } from "../models/settingintmapping.model.ts";
import { BusinessUnitSettingValueType } from "../models/businessunitsettingvalue.model.ts";

const exports: any = {}

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    //throws error if not found
    const setting: SettingType = await getOneForStringId(Setting, req.body.settingCode);

    req.body.id = undefined;

    if (req.body.settingValue > setting.dataValues.intMax || req.body.settingValue < setting.dataValues.intMin) {
        throw new AppError(400, `settingValue must be between ${setting.dataValues.intMin} and ${setting.dataValues.intMax}`);
    }
    const data: BusinessUnitSettingValueType = await BusinessUnitSettingValue.create(req.body);
    res.send(data);
}

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    //throws error if not found
    const businessUnitSettingValue: BusinessUnitSettingValueType = await getOneForId(BusinessUnitSettingValue, id);

    //Should not change the business unit or setting 
    req.body.businessUnitId = undefined;
    req.body.settingCode = undefined;
    req.body.id = undefined;

    const setting: SettingType = await getOneForStringId(Setting, businessUnitSettingValue.dataValues.settingCode);

    if (setting.dataValues.type === "string" && typeof req.body.settingValue == "string"){
        const settingIntMapping: SettingIntMappingType | null = await SettingIntMapping.findOne({where: {settingCode: setting.dataValues.code, stringValue: req.body.settingValue}});
        if (!settingIntMapping){
            throw new AppError(400, `Setting mapping for ${req.body.settingValue} not found`);
        }
        req.body.settingValue = settingIntMapping.dataValues.settingValue;
    }

    if (req.body.settingValue > setting.dataValues.intMax || req.body.settingValue < setting.dataValues.intMin) {
        throw new AppError(400, `settingValue must be between ${setting.dataValues.intMin} and ${setting.dataValues.intMax}`);
    }

    const numUpdated: number[] = await BusinessUnitSettingValue.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedBusinessUnitSettingValue: BusinessUnitSettingValueType = await getOneForId(BusinessUnitSettingValue, id);
    res.send(updatedBusinessUnitSettingValue);
};

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    const businessUnitSettingValue: BusinessUnitSettingValueType = await getOneForId(BusinessUnitSettingValue, id);
    const data: BusinessUnitSettingValueType | null = await BusinessUnitSettingValue.findOne({
        where: { id: id },
        include: [
            {
                model: Setting,
                include: [{
                    model: SettingIntMapping,
                    required: false,
                    where: { settingValue: businessUnitSettingValue.dataValues.settingValue }
                }]
            }]
    });
    return data;
}

export async function getBusinessUnitSettingValue(businessUnitId: number, settingCode: string): Promise<BusinessUnitSettingValueType> {
    const userSettingValue: BusinessUnitSettingValueType | null = await BusinessUnitSettingValue.findOne({
        where: {
            businessUnitId: businessUnitId,
            settingCode: settingCode
        }
    });
    if (!userSettingValue) {
        throw new AppError(404, `No setting value found for business unit ${businessUnitId} and setting code ${settingCode}`);
    }
    const settingValue: BusinessUnitSettingValueType | null = await BusinessUnitSettingValue.findOne({
        where: {
            businessUnitId: businessUnitId,
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

export default exports;