import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";


//employeeId, announcementId
const AnnouncementReceipt = SequelizeInstance.define("announcementreceipt", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    notified: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    read: {
        type: Sequelize.BOOLEAN
    },
    deleted: {
        type: Sequelize.BOOLEAN
    }
});

export default AnnouncementReceipt;
