import cron from 'node-cron';
import Shift from '../models/shift.model.ts';
import { Op } from 'sequelize';
import moment from 'moment';
import 'moment-timezone';
import { sendNotificationToEmployee } from '../services/notifications.ts';
import AnnouncementReceipt from '../models/announcementreceipt.model.ts';
import Announcement from '../models/announcement.model.ts';


// every 5 minutes, notify employees of their upcoming shifts
// note, behavior is undefined during daylight savings times
cron.schedule("*/5 * * * *", async () => {
    const momentInOneHour = moment().tz("America/Chicago").add(1, 'hours');
    const date = momentInOneHour.toDate().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const time = momentInOneHour.toDate().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false }).substring(0, 5)+":00";
    console.log(date)
    console.log(time)

    const allShifts = await Shift.findAll({where: {
        date: {[Op.eq]: date},
        startTime: { [Op.eq]: time },
    }});
    
    console.log("5 min cron");
    console.log("all shifts...");
    console.log(allShifts);
    console.log("all shifts done");

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
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

    const allUnnotifiedInPast = await AnnouncementReceipt.findAll(
        {
            include: [{
            model: Announcement,
            where: {
            [Op.or]: [
                { postAtDate: { [Op.lt]: today } },
                {
                    postAtDate: { [Op.eq]: today },
                    postAtTime: { [Op.lt]: currentTime }
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
        annRcpt.setDataValue("notified", true); // todo, could get return value of notification to update this intelligently...
        annRcpt.save()
    }
    
})