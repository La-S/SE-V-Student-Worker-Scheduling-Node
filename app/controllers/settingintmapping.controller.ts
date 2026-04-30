import db from "../models/index.ts";
const SettingIntMapping = db.SettingIntMapping;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId, getOneForStringId } from "../services/services.ts";
import Setting, { SettingType } from "../models/setting.model.ts";
import { parse } from "node:path";
import BusinessUnitSettingValue from "../models/businessunitsettingvalue.model.ts";
import { SettingIntMappingType } from "../models/settingintmapping.model.ts";
import { NotFoundError } from "../error/notfound.error.ts";

const exports = {} as any;

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    //throws error if not found
    const setting: SettingType = await getOneForStringId(Setting, req.body.settingCode);
    if (setting.dataValues.type !== "string") {
        throw new AppError(400, "Setting type must be string for mapping");
    }

    req.body.id = undefined;
    req.body.settingValue = setting.dataValues.intMax + 1;
    const data: SettingIntMappingType = await SettingIntMapping.create(req.body);
    await setting.update({ intMax: setting.dataValues.intMax + 1 });
    res.send(data);
}

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(SettingIntMapping, id);

    //Should not change the business unit or setting 
    req.body.settingCode = undefined;
    req.body.settingIntValue = undefined;
    req.body.id = undefined;

    const numUpdated = await SettingIntMapping.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedSettingIntMapping: SettingIntMappingType = await getOneForId(SettingIntMapping, id);
    res.send(updatedSettingIntMapping);
};

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    const data: SettingIntMappingType | null = await SettingIntMapping.findOne({
        where: { id: id },
        include: [Setting]
    });
    if (!data) {
        throw new NotFoundError("Setting int mapping", id);
    }
    return data;
}

exports.delete = async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id, 10);
    const settingIntMapping: SettingIntMappingType = await getOneForId(SettingIntMapping, id);
    const setting: SettingType = await getOneForStringId(Setting, settingIntMapping.dataValues.settingCode);
    await SettingIntMapping.destroy({ where: { id: id } });
    await setting.update({ intMax: setting.dataValues.intMax - 1 });
    res.send({ message: "setting int mapping deleted" });
}

export default exports;