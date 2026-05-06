import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";


//weeklyScheduleTemplateId
const WeeklyScheduleTemplate = SequelizeInstance.define("weeklyscheduletemplate", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING
    }
});

export default WeeklyScheduleTemplate;

export type WeeklyScheduleTemplateType = InstanceType<typeof WeeklyScheduleTemplate>;