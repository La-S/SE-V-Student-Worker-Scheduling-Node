import cron from 'node-cron';
import Shift from '../models/shift.model';
import { Op } from 'sequelize';
import moment from 'moment';
import { sendNotificationToEmployee } from '../services/notifications';


// every 5 minutes
cron.schedule("*/5 * * * *", async () => {
    const momentInOneHour = moment().add(1, 'hours');
    const date = momentInOneHour.toDate().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const time = momentInOneHour.toDate().toLocaleTimeString("en-US", { hour12: false });

    const allShifts = await Shift.findAll({where:{
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