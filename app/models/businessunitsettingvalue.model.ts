import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//settingCode
//businessUnitId
const BusinessUnitSettingValue = SequelizeInstance.define("businessunitsettingvalue", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    settingValue: {
        type: Sequelize.INTEGER
    }

});

export default BusinessUnitSettingValue;

export type BusinessUnitSettingValueType = InstanceType<typeof BusinessUnitSettingValue>;