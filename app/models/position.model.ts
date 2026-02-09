import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//businessUnitId
const Position = SequelizeInstance.define("position", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    payRate: {
        type: Sequelize.DECIMAL,
        allowNull: true,
        defaultValue: 20
    }
});

export default Position;
