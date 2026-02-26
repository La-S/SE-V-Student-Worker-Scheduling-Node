import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";
import { daysOfWeek } from "../types/dayofweek.enum.ts";
import { availabilityPreferences } from "../types/availabilitypreference.enum.ts";

//userId
const AvailabilityTemplate = SequelizeInstance.define("availabilitytemplate", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    dayOfWeek: {
        type: Sequelize.ENUM(...Object.values(daysOfWeek))
    },
    startTime: {
        type: Sequelize.TIME
    },
    endTime: {
        type: Sequelize.TIME
    },
    preference: {
        type: Sequelize.ENUM(...Object.values(availabilityPreferences))
    }

});

export default AvailabilityTemplate;
