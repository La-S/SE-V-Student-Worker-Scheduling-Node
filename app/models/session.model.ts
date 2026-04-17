import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//userId
const Session = SequelizeInstance.define("session", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    token: {
        type: Sequelize.STRING(3000),
        allowNull: true,
        unique: true
    },
    email: {
        type: Sequelize.STRING(100),
        allowNull: false,
    },
    expirationDate: {
        type: Sequelize.DATE,
        allowNull: false,
    },
});

export default Session;
