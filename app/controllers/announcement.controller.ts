
import { Op } from 'sequelize';
import Employee, { type EmployeeType } from '../models/employee.model.ts';
import Announcement, { type AnnouncementType } from '../models/announcement.model.ts';
import AnnouncementReceipt, { type AnnouncementReceiptType } from '../models/announcementreceipt.model.ts';
import { type Request, type Response } from 'express';
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
import BusinessUnit, { type BusinessUnitType } from '../models/businessunit.model.ts';
import { type AnnouncementValuesType } from '../types/announcement.type.ts';

export async function create(req: Request, res: Response) {
    let sendNotifNow: boolean = false;

    const businessUnit: BusinessUnitType = await getOneForId(BusinessUnit, req.body.businessUnitId);

    const employees: EmployeeType[] = await Employee.findAll({
        where: {
            businessUnitId: req.body.businessUnitId,
            currentlyEmployed: true,
        }
    });

    const employeeIds: number[] = employees.map((employee: EmployeeType) => employee.dataValues.id);

    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    if (!req.body.postAtDate) {
        req.body.postAtDate = today;
    }
    if (!req.body.postAtTime) {
        req.body.postAtTime = currentTime;
    }

    const announcement: AnnouncementType = await Announcement.create(req.body);
    const announcementId: number = announcement.dataValues.id;

    const isRightNow: AnnouncementValuesType | null = (await Announcement.findOne({
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
        const announcementReceiptBody = {
            "employeeId": employeeId,
            "announcementId": announcementId,
            "read": false,
            "deleted": false,
            "notified": sendNotifNow,
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
}

export async function createSpecificEmployees(req: Request, res: Response) {
    let sendNotifNow: boolean = false;

    const employeeIds: number[] = req.body.employeeIds;

    const businessUnit: BusinessUnitType = await getOneForId(BusinessUnit, req.body.businessUnitId);

    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    if (!req.body.postAtDate) {
        req.body.postAtDate = today;
    }
    if (!req.body.postAtTime) {
        req.body.postAtTime = currentTime;
    }

    const announcement: AnnouncementType = await Announcement.create(req.body);
    const announcementId: number = announcement.dataValues.id;

    const isRightNow: AnnouncementValuesType | null = (await Announcement.findOne({
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
        const announcementReceiptBody = {
            "employeeId": employeeId,
            "announcementId": announcementId,
            "read": false,
            "deleted": false,
            "notified": sendNotifNow,
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
}

export async function sendEmail(req: Request, res: Response) {
    const id: number = parseInt(req.params.id, 10);

    const announcement: AnnouncementType | null = await getOneForId(Announcement, id);

    const receipts: AnnouncementReceiptType[] = await AnnouncementReceipt.findAll({
        where: {
            announcementId: id,
            deleted: false,
        },
    });

    const employeeIds: number[] = receipts
        .map((receipt: AnnouncementReceiptType) => receipt.dataValues.employeeId)
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
}

export async function update(req: Request, res: Response) {
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

    const updatedAnnouncement: AnnouncementType | null = await getOneForId(Announcement, id);

    res.send(updatedAnnouncement);
}

export async function findOne(req: Request, res: Response) {
    const id: number = parseInt(req.params.id, 10);

    const data: AnnouncementType | null = await Announcement.findOne({
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
}

