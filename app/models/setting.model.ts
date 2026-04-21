import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";
import { settingTypes } from "../types/settings.enum.ts";

//setting
const Setting = SequelizeInstance.define("setting", {
    code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    type: {
        type: Sequelize.ENUM(...Object.values(settingTypes)),
    },
    intMin: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    intMax: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    defaultValue: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    //true if business, false if user, null if testing
    isForBusinessUnit: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
    },
});

export default Setting;