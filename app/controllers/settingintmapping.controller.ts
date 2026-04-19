import db from "../models/index.ts";
const SettingIntMapping = db.SettingIntMapping;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId, getOneForStringId } from "../services/services.ts";
import Setting from "../models/setting.model.ts";
import { parse } from "node:path";
import BusinessUnitSettingValue from "../models/businessunitsettingvalue.model.ts";

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    //throws error if not found
    const setting = await getOneForStringId(Setting, req.body.settingCode);

    req.body.id = undefined;
    req.body.intValue = setting.dataValues.intMax + 1;
    const data = await SettingIntMapping.create(req.body);
    setting.update({ intMax: setting.dataValues.intMax + 1 });
    res.send(data);
}

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(SettingIntMapping, id);

    //Should not change the business unit or setting 
    req.body.settingCode = undefined;
    req.body.id = undefined;

    const numUpdated = await SettingIntMapping.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedSettingIntMapping = await getOneForId(SettingIntMapping, id);
    res.send(updatedSettingIntMapping);
};

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const data = await SettingIntMapping.findOne({
        where: { id: id },
        include: [Setting]
    });
    return data;
}

exports.delete = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const setting = await getOneForStringId(Setting, req.body.settingCode);
    setting.update({ intMax: setting.dataValues.intMax - 1 });
    res.send("setting int mapping deleted");
}

export default exports;