import db from "../models/index.ts";
const UserSettingValue = db.UserSettingValue;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import Setting from "../models/setting.model.ts";
import { parse } from "node:path";
import SettingIntMapping from "../models/settingintmapping.model.ts";

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    const settingId = parseInt(req.body.settingId, 10);
    //throws error if not found
    await getOneForId(Setting, settingId);

    req.body.id = undefined;
    const data = await UserSettingValue.create(req.body);
    res.send(data);
}

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(UserSettingValue, id);

    //Should not change the business unit or setting 
    req.body.userId = undefined;
    req.body.settingId = undefined;
    req.body.id = undefined;

    const numUpdated = await UserSettingValue.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedUserSettingValue = await getOneForId(UserSettingValue, id);
    res.send(updatedUserSettingValue);
};

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const userSettingValue = await getOneForId(UserSettingValue, id);
    const data = await UserSettingValue.findOne({
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

export default exports;