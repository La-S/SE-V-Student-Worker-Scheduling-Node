import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const PushToken = SequelizeInstance.define("pushToken", {
    token: {
        type: Sequelize.STRING(300),
        allowNull: false,
        primaryKey: true,
    },
});

export default PushToken;
