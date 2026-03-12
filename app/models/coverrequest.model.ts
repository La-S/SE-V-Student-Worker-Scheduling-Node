import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//shiftId, requesterId, accepterId, reviewedBy
const CoverRequest = SequelizeInstance.define("coverrequest", {
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
    acceptTime: {
        type: Sequelize.TIME
    },
    acceptDate: {
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
    }

});

export default CoverRequest