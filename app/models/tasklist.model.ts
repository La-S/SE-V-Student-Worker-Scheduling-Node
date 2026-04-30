import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

//businessUnitId
const TaskList = SequelizeInstance.define("tasklist", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
})

export default TaskList

export type TaskListType = InstanceType<typeof TaskList>;