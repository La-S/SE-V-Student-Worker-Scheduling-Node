import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";
import { announcementPriorities } from "../types/announcementpriority.enum.ts";

//authorId, businessUnitId
const Announcement = SequelizeInstance.define("announcement", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    subject: {
        type: Sequelize.STRING
    },
    body: {
        type: Sequelize.TEXT //max varchar
    },
    postAtTime: {
        type: Sequelize.TIME
    },
    postAtDate: {
        type: Sequelize.DATEONLY
    },
    priority: {
        type: Sequelize.ENUM(...Object.values(announcementPriorities)),
        defaultValue: "low"
    }

});

export default Announcement;
