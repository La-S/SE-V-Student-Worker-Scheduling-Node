import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//settingCode
//businessUnitId
const UserUnitSettingValue = SequelizeInstance.define("usersettingvalue", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    settingValue: {
        type: Sequelize.INTEGER
    }

});

export default UserUnitSettingValue;