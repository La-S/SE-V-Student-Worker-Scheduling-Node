import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";


//userId, fileId
const UserFile = SequelizeInstance.define("userFile", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    }
});

export default UserFile;
