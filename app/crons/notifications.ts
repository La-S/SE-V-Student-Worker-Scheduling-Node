import cron from 'node-cron';
import Shift from '../models/shift.model.ts';
import { Op } from 'sequelize';
import moment from 'moment';
import { sendNotificationToEmployee } from '../services/notifications.ts';


// every 5 minutes
// note, behavior is undefined during daylight savings times
cron.schedule("*/5 * * * *", async () => {
    const momentInOneHour = moment().add(1, 'hours');
    const date = momentInOneHour.toDate().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const time = momentInOneHour.toDate().toLocaleTimeString("en-US", { hour12: false }) .substring(0, 5)+":00";
    console.log(date)
    console.log(time)

    const allShifts = await Shift.findAll({where:{
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