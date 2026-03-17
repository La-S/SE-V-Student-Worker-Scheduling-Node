import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";
import { settingTypes } from "../types/settings.enum.ts";

//settings
const Settings = SequelizeInstance.define("settings", {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    type: {
        type: Sequelize.ENUM(...Object.values(settingTypes)),
    },
    intMin: {
        type: Sequelize.INTEGER
    },
    intMax: {
        type: Sequelize.INTEGER
    },
    forBusiness: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
    },
});

export default Settings;