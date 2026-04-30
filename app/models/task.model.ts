import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";
import { TaskValuesType } from '../types/tasktype.ts';

//taskListId
const Task = SequelizeInstance.define("task", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    sequenceNumber: {
        type: Sequelize.INTEGER
    }
})

export default Task

export type TaskType = InstanceType<typeof Task>;