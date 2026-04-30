import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//requesterId, reviewedBy
const TimeOffRequest = SequelizeInstance.define("timeoffrequest", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    startDate: {
        type: Sequelize.DATEONLY
    },
    endDate: {
        type: Sequelize.DATEONLY
    },
    requestPostedTime: {
        type: Sequelize.TIME,
    },
    requestPostedDate: {
        type: Sequelize.DATEONLY
    },
    approval: {
        type: Sequelize.BOOLEAN
    },
    reviewedTime: {
        type: Sequelize.TIME
    },
    reviewedDate: {
        type: Sequelize.DATEONLY
    },
    note: {
        type: Sequelize.STRING
    }
});

export default TimeOffRequest;

export type TimeOffRequestType = InstanceType<typeof TimeOffRequest>;