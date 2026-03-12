import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";


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
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 0,
            max: 6,
            isInt: true
        }
    },
    startTime: {
        type: Sequelize.TIME
    },
    endTime: {
        type: Sequelize.TIME
    }
});

export default OpenHours;
