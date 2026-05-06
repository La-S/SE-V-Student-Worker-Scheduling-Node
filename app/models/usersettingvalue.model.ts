import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//settingCode
//userId
const UserSettingValue = SequelizeInstance.define("usersettingvalue", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    settingValue: {
        type: Sequelize.INTEGER
    }

});

export default UserSettingValue;

export type UserSettingValueType = InstanceType<typeof UserSettingValue>;