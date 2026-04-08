
const exports: any = {};
import { Model, Op } from 'sequelize';
import Employee from '../models/employee.model.ts';
import Announcement from '../models/announcement.model.ts';
import AnnouncementReceipt from '../models/announcementreceipt.model.ts';
import pkg from 'express';
import { AppError } from "../error/app.error.ts";
import { getOneForId, getStringFromDate } from "../services/services.ts";
import BusinessUnit from '../models/businessunit.model.ts';
import User from '../models/user.model.ts';
import { NotFoundError } from '../error/notfound.error.ts';
import AnnouncementFile from '../models/announcementfile.model.ts';
import File from "../models/file.model.ts";
import { sendNotificationToEmployee } from '../services/notifications.ts';

exports.create = async (req: pkg.Request, res: pkg.Response) => {
    const businessUnit = await getOneForId(BusinessUnit, req.body.businessUnitId);
    const employees = await Employee.findAll({
        where: {
            businessUnitId: businessUnit.dataValues.id,
            currentlyEmployed: true
        }
    });
    const employeeIds: number[] = [];
    for (const employee of employees) {
        employeeIds.push(employee.dataValues.id);
    }
    if (!req.body.postAtDate) {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
        req.body.postAtDate = today;
    }
    if (!req.body.postAtTime) {
        const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
        req.body.postAtTime = currentTime;
    }
    const announcement = await Announcement.create(req.body);
    const announcementId = announcement.dataValues.id;

    for (const employeeId of employeeIds) {
        const announcementReceiptBody = {
            "employeeId": employeeId,
            "announcementId": announcementId,
            "read": false,
            "deleted": false
        };
        await AnnouncementReceipt.create(announcementReceiptBody);
        sendNotificationToEmployee(employeeId, req.body.subject ?? 'No Subject', req.body.body ?? 'No Content')
    }
    res.send(announcement);
}

exports.createSpecificEmployees = async (req: pkg.Request, res: pkg.Response) => {
    const businessUnit = await getOneForId(BusinessUnit, req.body.businessUnitId);
    const employeeIds: number[] = req.body.employeeIds;
    const announcement = await Announcement.create(req.body);
    const announcementId = announcement.dataValues.id;

    if (!req.body.postAtDate) {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
        req.body.postAtDate = today;
    }
    if (!req.body.postAtTime) {
        const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
        req.body.postAtTime = currentTime;
    }
    for (const employeeId of employeeIds) {
        const announcementReceiptBody = {
            "employeeId": employeeId,
            "announcementId": announcementId,
            "read": false,
            "deleted": false
        };
        await AnnouncementReceipt.create(announcementReceiptBody);
        sendNotificationToEmployee(employeeId, req.body.subject ?? 'No Subject', req.body.body ?? 'No Content')
    }
    res.send(announcement);
}

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
