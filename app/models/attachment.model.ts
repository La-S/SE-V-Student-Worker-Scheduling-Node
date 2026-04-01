import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";


//announcementId
const Attachment = SequelizeInstance.define("attachment", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    image: {
        type: Sequelize.BLOB('long')
    }
});

export default Attachment;
