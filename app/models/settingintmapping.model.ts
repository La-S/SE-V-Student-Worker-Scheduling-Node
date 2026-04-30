import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";
import Setting from "./setting.model.ts";

//settingCode
//businessUnitId
const SettingIntMapping = SequelizeInstance.define("settingintmapping", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    settingValue: {
        type: Sequelize.INTEGER
    },
    stringValue: {
        type: Sequelize.STRING
    }

});

export default SettingIntMapping;
export type SettingIntMappingType = InstanceType<typeof SettingIntMapping>;