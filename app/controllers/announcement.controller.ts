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

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    let sendNotifNow = false;
    const businessUnit = await getOneForId(BusinessUnit, req.body.businessUnitId);
    const employees = await Employee.findAll({
        where: {
            businessUnitId: req.body.businessUnitId,
            currentlyEmployed: true,
        }
    });
    const employeeIds: number[] = employees.map((employee) => employee.dataValues.id);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    if (!req.body.postAtDate) {
        req.body.postAtDate = today;
    }
    if (!req.body.postAtTime) {
        req.body.postAtTime = currentTime;
    }
    const announcement = await Announcement.create(req.body);
    const announcementId = announcement.dataValues.id;

    const isRightNow = (await Announcement.findOne({
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
    }))?.dataValues

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
            sendNotificationToEmployee(employeeId, req.body.subject ?? 'No Subject', req.body.body ?? 'No Content')
        }
    }
    res.send(announcement);
}

exports.createSpecificEmployees = async (req: pkg.Request, res: pkg.Response) => {
    let sendNotifNow = false;
    const employeeIds: number[] = req.body.employeeIds;
    const businessUnit = await getOneForId(BusinessUnit, req.body.businessUnitId);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    if (!req.body.postAtDate) {
        req.body.postAtDate = today;
    }
    if (!req.body.postAtTime) {
        req.body.postAtTime = currentTime;
    }

    const announcement = await Announcement.create(req.body);
    const announcementId = announcement.dataValues.id;

    const isRightNow = (await Announcement.findOne({
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
    }))?.dataValues

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
            sendNotificationToEmployee(employeeId, req.body.subject ?? 'No Subject', req.body.body ?? 'No Content')
        }
    }
    res.send(announcement);
}

exports.sendEmail = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    await getOneForId(Announcement, id);

    const receipts = await AnnouncementReceipt.findAll({
        where: {
            announcementId: id,
            deleted: false,
        },
    });
    const employeeIds = receipts
        .map((receipt) => receipt.dataValues.employeeId)
        .filter((employeeId) => Number.isInteger(employeeId));

    if (employeeIds.length === 0) {
        throw new AppError(404, `Announcement ${id} has no recipients.`);
    }

    const subject = announcement?.dataValues?.subject ?? 'No Subject';
    const text = announcement?.dataValues?.body ?? 'No Content';

    await sendAnnouncementEmailToEmployeeIds(employeeIds, id, {
        subject,
        text,
    });

    res.send({ message: 'Announcement email sent.' });
};

exports.update = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(Announcement, id);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
    if (req.body.postAtDate < today) {
        throw new AppError(400, "Cannot post an announcement to the past.")
    }
    //tries to account for latency discrepancies
    if (req.body.postAtDate === today && req.body.postAtTime < currentTime) {
        req.body.postAtTime = currentTime;
    }
    await Announcement.update(req.body, { where: { id: id } });
    const updatedAnnouncement = await getOneForId(Announcement, id);
    res.send(updatedAnnouncement);
}

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const data = await Announcement.findOne({
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


export default exports;
