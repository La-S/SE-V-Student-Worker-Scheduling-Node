import db from "../models/index.ts";
const SettingIntMapping = db.SettingIntMapping;
import { Model, Op } from 'sequelize';
import { type Request, type Response } from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId, getOneForStringId } from "../services/services.ts";
import Setting from "../models/setting.model.ts";
import { parse } from "node:path";
import BusinessUnitSettingValue from "../models/businessunitsettingvalue.model.ts";


export async function create(req: Request, res: Response) {
    //throws error if not found
    const setting = await getOneForStringId(Setting, req.body.settingCode);
    if (setting.dataValues.type !== "string") {
        throw new AppError(400, "Setting type must be string for mapping");
    }

    req.body.id = undefined;
    req.body.settingValue = setting.dataValues.intMax + 1;
    const data = await SettingIntMapping.create(req.body);
    setting.update({ intMax: setting.dataValues.intMax + 1 });
    res.send(data);
}

export async function update(req: Request, res: Response) {
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
    let updatedSettingIntMapping = await getOneForId(SettingIntMapping, id);
    res.send(updatedSettingIntMapping);
}

export async function findOne(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    const data = await SettingIntMapping.findOne({
        where: { id: id },
        include: [Setting]
    });
    return data;
}

export async function delete(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    const settingIntMapping = await getOneForId(SettingIntMapping, id);
    const setting = await getOneForStringId(Setting, settingIntMapping.dataValues.settingCode);
    await SettingIntMapping.destroy({where: {id: id}});
    setting.update({ intMax: setting.dataValues.intMax - 1 });
    res.send({message: "setting int mapping deleted"});
}

