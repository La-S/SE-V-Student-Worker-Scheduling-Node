import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";


//announcementId, fileId
const AnnouncementFile = SequelizeInstance.define("announcementFile", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    description: {
        type: Sequelize.STRING
    }
});

export default AnnouncementFile;
