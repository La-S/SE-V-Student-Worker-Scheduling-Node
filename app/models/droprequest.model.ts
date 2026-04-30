import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//shiftId, requesterId, accepterId, reviewedBy
const DropRequest = SequelizeInstance.define("droprequest", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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

export default DropRequest

export type DropRequestType = InstanceType<typeof DropRequest>;