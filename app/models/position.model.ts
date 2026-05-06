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
        type: Sequelize.DECIMAL(10,2),
        allowNull: true,
        defaultValue: 20
    },
    color: {
        type: Sequelize.STRING(),
        allowNull: true,
        defaultValue: "#78acff" //neutral light blue
    }
});

export default Position;

export type PositionType = InstanceType<typeof Position>;