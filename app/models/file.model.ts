import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

const File = SequelizeInstance.define("file", {
    id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    image: {
        type: Sequelize.TEXT('long')
    }
});
export default File;
