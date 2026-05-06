import cron from 'node-cron';
import Shift from '../models/shift.model.ts';
import { Op } from 'sequelize';
import moment from 'moment';
import 'moment-timezone';
import { sendNotificationToEmployee } from '../services/notifications.ts';
import { sendAnnouncementEmailToEmployeeIds } from '../services/mailer.ts';
import AnnouncementReceipt from '../models/announcementreceipt.model.ts';
import Announcement from '../models/announcement.model.ts';


// every 5 minutes, notify employees of their upcoming shifts
// note, behavior is undefined during daylight savings times
cron.schedule("*/5 * * * *", async () => {
    const momentInOneHour = moment().tz("America/Chicago").add(1, 'hours');
    const date: string = momentInOneHour.toDate().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const time: string = momentInOneHour.toDate().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false }).substring(0, 5)+":00";

    const allShifts: Shift[] = await Shift.findAll({where: {
        date: {[Op.eq]: date},
        startTime: { [Op.eq]: time },
    }});

    for (let shift of allShifts) {
        if (!shift.dataValues.employeeId) {
            continue;
        }
        sendNotificationToEmployee(shift.dataValues.employeeId, "Shift upcoming!", "Your shift is scheduled to start in one hour!");
    }
})

// every minute, notify employees of posted announcements
// note, behavior is undefined during daylight savings times
cron.schedule("*/1 * * * *", async () => {
    const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const allUnnotifiedInPast: AnnouncementReceipt[] = await AnnouncementReceipt.findAll(
        {
            include: [{
            model: Announcement,
            where: {
            [Op.or]: [
                { postAtDate: { [Op.lt]: today } },
                {
                    postAtDate: { [Op.eq]: today },
                    postAtTime: { [Op.lte]: currentTime }
                }
            ],
        }
        }],
        where: {[Op.or]:[
            {notified: {[Op.eq]: null} },
            {notified: {[Op.eq]: false} },
        ]},
    });
    
    // console.log("all unnotified... #", allUnnotifiedInPast.length);

    for (let annRcpt of allUnnotifiedInPast) {
        sendNotificationToEmployee(annRcpt.dataValues.employeeId, annRcpt.dataValues.announcement.subject ?? 'No subject', annRcpt.dataValues.announcement.body ?? 'No body');
        void sendAnnouncementEmailToEmployeeIds([annRcpt.dataValues.employeeId], annRcpt.dataValues.announcement.id, {
            subject: annRcpt.dataValues.announcement.subject ?? 'No subject',
            text: annRcpt.dataValues.announcement.body ?? 'No body',
        });
        annRcpt.setDataValue("notified", true); // todo, could get return value of notification to update this intelligently...
        annRcpt.save()
    }
    
})
