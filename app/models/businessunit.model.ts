import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const BusinessUnit = SequelizeInstance.define("businessunit", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING(100),
        allowNull: false
    }
});

export default BusinessUnit;
