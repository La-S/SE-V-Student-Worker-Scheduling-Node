import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";


//userId, fileId
const UserFile = SequelizeInstance.define("userFile", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    description: {
        type: Sequelize.STRING
    }
});

export default UserFile;

export type UserFileType = InstanceType<typeof UserFile>;