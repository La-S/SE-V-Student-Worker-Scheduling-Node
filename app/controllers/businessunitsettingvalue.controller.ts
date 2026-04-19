import db from "../models/index.ts";
const BusinessUnitSettingValue = db.BusinessUnitSettingValue;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId, getOneForStringId } from "../services/services.ts";
import Setting from "../models/setting.model.ts";
import { parse } from "node:path";
import SettingIntMapping from "../models/settingintmapping.model.ts";

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    //throws error if not found
    const setting = await getOneForStringId(Setting, req.body.settingCode);

    req.body.id = undefined;

    if (req.body.settingValue > setting.dataValues.intMax || req.body.settingValue < setting.dataValues.intMin) {
        throw new AppError(400, `settingValue must be between ${setting.dataValues.intMin} and ${setting.dataValues.intMax}`);
    }
    const data = await BusinessUnitSettingValue.create(req.body);
    res.send(data);
}

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(BusinessUnitSettingValue, id);

    //Should not change the business unit or setting 
    req.body.businessUnitId = undefined;
    req.body.settingCode = undefined;
    req.body.id = undefined;

    const setting = await getOneForStringId(Setting, req.body.settingCode);

    if (req.body.settingValue > setting.dataValues.intMax || req.body.settingValue < setting.dataValues.intMin) {
        throw new AppError(400, `settingValue must be between ${setting.dataValues.intMin} and ${setting.dataValues.intMax}`);
    }

    const numUpdated = await BusinessUnitSettingValue.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedBusinessUnitSettingValue = await getOneForId(BusinessUnitSettingValue, id);
    res.send(updatedBusinessUnitSettingValue);
};

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const businessUnitSettingValue = await getOneForId(BusinessUnitSettingValue, id);
    const data = await BusinessUnitSettingValue.findOne({
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

export async function getBusinessUnitSettingValue(businessUnitId: number, settingCode: string): Promise<Model<any, any>> {
    const businessUnitSettingValue = await BusinessUnitSettingValue.findOne({
        where: {
            businessUnitId: businessUnitId,
        }
    });
    if (!businessUnitSettingValue) {
        throw new AppError(404, `No setting value found for business unit ${businessUnitId} and setting code ${settingCode}`);
    }
    const settingValue = await BusinessUnitSettingValue.findOne({
        where: {
            businessUnitId: businessUnitId,
        },
        include: [{
            model: Setting,
            where: {
                settingCode: settingCode
            },
            include: [{
                model: SettingIntMapping,
                required: false,
                where: { settingValue: businessUnitSettingValue.dataValues.settingValue }
            }]

        }]
    });
    return settingValue!;
}

export default exports;