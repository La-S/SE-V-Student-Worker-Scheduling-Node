import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";
import { daysOfWeek} from "../types/dayofweek.enum.ts";


//weeklyScheduleTemplateId
const DailyScheduleTemplate = SequelizeInstance.define("dailyscheduletemplate", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    dayOfWeek: {
        type: Sequelize.ENUM(...Object.values(daysOfWeek))
    }
});

export default DailyScheduleTemplate;

export type DailyScheduleTemplateType = InstanceType<typeof DailyScheduleTemplate>;