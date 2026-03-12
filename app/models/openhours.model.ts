import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";


// OpenHours for business unit
const OpenHours = SequelizeInstance.define("openhours", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    businessUnitId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    dayOfWeek: {
     type: Sequelize.ENUM(...Object.values(daysOfWeek))
        
    },
    startTime: {
        type: Sequelize.TIME
    },
    endTime: {
        type: Sequelize.TIME
    }
});

export default OpenHours;
