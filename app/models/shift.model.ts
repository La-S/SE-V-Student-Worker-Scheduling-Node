import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//    employeeId: int
//     positionId: int
//     dailyScheduleTemplateId: int - not implemented
//     businessUnitId: int
const Shift = SequelizeInstance.define("shift", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    startTime: {
        type: Sequelize.TIME,
        allowNull: false
    },
    endTime: {
        type: Sequelize.TIME,
        allowNull: false
    },
    date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    published: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    }
})

export default Shift;