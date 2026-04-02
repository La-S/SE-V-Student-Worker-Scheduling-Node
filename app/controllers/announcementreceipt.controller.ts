import db from "../models/index.ts";
const AnnouncementReceipt = db.AnnouncementReceipt;
import pkg from 'express';
import { NotFoundError } from "../error/notfound.error.ts";
import { AppError } from "../error/app.error.ts";
import Announcement from "../models/announcement.model.ts";
import Employee from "../models/employee.model.ts";
import User from "../models/user.model.ts";
import { getOneForId } from "../services/services.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import { Model } from "sequelize";
import AnnouncementFile from "../models/announcementfile.model.ts";

const exports: any = {};
const errorClassName = "AnnouncementReceipt";

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const data = await AnnouncementReceipt.create(req.body);
    const receipt = await getReceiptForId(data.dataValues.id);
    res.send(receipt);
};

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const data = await getReceiptForId(id);
    res.send(data);
};

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    await getReceiptForId(id);

    req.body.id = undefined;
    req.body.employeeId = undefined;
    req.body.announcementId = undefined;

    const numUpdated = await AnnouncementReceipt.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`);
    }
    const updatedReceipt = await getReceiptForId(id);
    res.send(updatedReceipt);
};

exports.setDeleted = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    await getReceiptForId(id);

    const numUpdated = await AnnouncementReceipt.update(
        { deleted: true },
        { where: { id: id } }
    );
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Could not mark receipt ${id} as deleted.`);
    }
    const updatedReceipt = await getReceiptForId(id);
    res.send(updatedReceipt);
};

exports.setRead = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    await getReceiptForId(id);

    const numUpdated = await AnnouncementReceipt.update(
        { read: true },
        { where: { id: id } }
    );
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Could not mark receipt ${id} as read.`);
    }
    const updatedReceipt = await getReceiptForId(id);
    res.send(updatedReceipt);
};

async function getReceiptForId(id: number) {
    if (!id) {
        throw new AppError(400, "id provided must be an integer");
    }
    const data = await AnnouncementReceipt.findByPk(id, {
        include: [
            { model: Announcement, include: [{ model: Employee, include: [User] }]},
            BusinessUnit
        ]
    });
    if (!data) {
        throw new NotFoundError(errorClassName, id);
    }
    return data;
}

export default exports;