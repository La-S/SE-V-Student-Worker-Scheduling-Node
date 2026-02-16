import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//taskId
//shiftId,
//checkedOffEmployee
const TaskCompletion = SequelizeInstance.define("taskcompletion", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    checkedOff: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    time: {
        type: Sequelize.TIME
    }
})


export default TaskCompletion