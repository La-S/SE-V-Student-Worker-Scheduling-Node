import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";
import { TaskCompletionValuesType } from '../types/taskcompletion.type.ts';

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
    },
    date: {
        type: Sequelize.DATEONLY
    }
})

export default TaskCompletion

export type TaskCompletionType = InstanceType<typeof TaskCompletion>;