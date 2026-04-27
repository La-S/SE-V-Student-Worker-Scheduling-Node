const exports: any = {};

import { Op } from 'sequelize';
import Employee from '../models/employee.model.ts';
import Announcement from '../models/announcement.model.ts';
import AnnouncementReceipt from '../models/announcementreceipt.model.ts';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId } from "../services/services.ts";
import { NotFoundError } from '../error/notfound.error.ts';
import AnnouncementFile from '../models/announcementfile.model.ts';
import File from "../models/file.model.ts";
import User from '../models/user.model.ts';
import { sendNotificationToEmployee } from '../services/notifications.ts';
import {
    sendAnnouncementEmailToEmployeeIds,
} from '../services/mailer.ts';
import BusinessUnit from '../models/businessunit.model.ts';

const { Request, Response } = pkg;

exports.create = async (req: typeof Request.prototype, res: typeof Response.prototype): Promise<void> => {
    let sendNotifNow: boolean = false;

    const businessUnit: BusinessUnit = await getOneForId(BusinessUnit, req.body.businessUnitId);

    const employees: Employee[] = await Employee.findAll({
        where: {
            businessUnitId: req.body.businessUnitId,
            currentlyEmployed: true,
        }
    });

    const employeeIds: number[] = employees.map((employee: Employee) => employee.dataValues.id);

    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    if (!req.body.postAtDate) {
        req.body.postAtDate = today;
    }
    if (!req.body.postAtTime) {
        req.body.postAtTime = currentTime;
    }

    const announcement: Announcement = await Announcement.create(req.body);
    const announcementId: number = announcement.dataValues.id;

    const isRightNow: Announcement | null = (await Announcement.findOne({
        where: {
            id: announcementId,
            [Op.or]: [
                { postAtDate: { [Op.lt]: today } },
                {
                    postAtDate: today,
                    postAtTime: { [Op.lte]: currentTime }
                }
            ]
        },
    }))?.dataValues;

    if (isRightNow) {
        sendNotifNow = true;
    }

    for (const employeeId of employeeIds) {
        const announcementReceiptBody: {
            employeeId: number;
            announcementId: number;
            read: boolean;
            deleted: boolean;
            notified: boolean;
        } = {
            employeeId: employeeId,
            announcementId: announcementId,
            read: false,
            deleted: false,
            notified: sendNotifNow,
        };

        await AnnouncementReceipt.create(announcementReceiptBody);

        if (sendNotifNow) {
            sendNotificationToEmployee(
                employeeId,
                req.body.subject ?? 'No Subject',
                req.body.body ?? 'No Content'
            );
        }
    }

    res.send(announcement);
};

exports.createSpecificEmployees = async (req: typeof Request.prototype, res: typeof Response.prototype): Promise<void> => {
    let sendNotifNow: boolean = false;

    const employeeIds: number[] = req.body.employeeIds;

    const businessUnit: BusinessUnit = await getOneForId(BusinessUnit, req.body.businessUnitId);

    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    if (!req.body.postAtDate) {
        req.body.postAtDate = today;
    }
    if (!req.body.postAtTime) {
        req.body.postAtTime = currentTime;
    }

    const announcement: Announcement = await Announcement.create(req.body);
    const announcementId: number = announcement.dataValues.id;

    const isRightNow: Announcement | null = (await Announcement.findOne({
        where: {
            id: announcementId,
            [Op.or]: [
                { postAtDate: { [Op.lt]: today } },
                {
                    postAtDate: today,
                    postAtTime: { [Op.lte]: currentTime }
                }
            ]
        },
    }))?.dataValues;

    if (isRightNow) {
        sendNotifNow = true;
    }

    for (const employeeId of employeeIds) {
        const announcementReceiptBody: {
            employeeId: number;
            announcementId: number;
            read: boolean;
            deleted: boolean;
            notified: boolean;
        } = {
            employeeId: employeeId,
            announcementId: announcementId,
            read: false,
            deleted: false,
            notified: sendNotifNow,
        };

        await AnnouncementReceipt.create(announcementReceiptBody);

        if (sendNotifNow) {
            sendNotificationToEmployee(
                employeeId,
                req.body.subject ?? 'No Subject',
                req.body.body ?? 'No Content'
            );
        }
    }

    res.send(announcement);
};

exports.sendEmail = async (req: typeof Request.prototype, res: typeof Response.prototype): Promise<void> => {
    const id: number = parseInt(req.params.id, 10);

    const announcement: Announcement | null = await getOneForId(Announcement, id);

    const receipts: AnnouncementReceipt[] = await AnnouncementReceipt.findAll({
        where: {
            announcementId: id,
            deleted: false,
        },
    });

    const employeeIds: number[] = receipts
        .map((receipt: AnnouncementReceipt) => receipt.dataValues.employeeId)
        .filter((employeeId: number) => Number.isInteger(employeeId));

    if (employeeIds.length === 0) {
        throw new AppError(404, `Announcement ${id} has no recipients.`);
    }

    const subject: string = announcement?.dataValues?.subject ?? 'No Subject';
    const text: string = announcement?.dataValues?.body ?? 'No Content';

    await sendAnnouncementEmailToEmployeeIds(employeeIds, id, {
        subject,
        text,
    });

    res.send({ message: 'Announcement email sent.' });
};

exports.update = async (req: typeof Request.prototype, res: typeof Response.prototype): Promise<void> => {
    const id: number = parseInt(req.params.id, 10);

    await getOneForId(Announcement, id);

    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    if (req.body.postAtDate < today) {
        throw new AppError(400, "Cannot post an announcement to the past.");
    }

    if (req.body.postAtDate === today && req.body.postAtTime < currentTime) {
        req.body.postAtTime = currentTime;
    }

    await Announcement.update(req.body, { where: { id: id } });

    const updatedAnnouncement: Announcement | null = await getOneForId(Announcement, id);

    res.send(updatedAnnouncement);
};

exports.findOne = async (req: typeof Request.prototype, res: typeof Response.prototype): Promise<void> => {
    const id: number = parseInt(req.params.id, 10);

    const data: Announcement | null = await Announcement.findOne({
        where: { id: id },
        include: [
            { model: Employee, include: [User] },
            { model: AnnouncementFile, include: [File] }
        ]
    });

    if (!data) {
        throw new NotFoundError("Announcement", id);
    }

    res.send(data);
};

export default exports;