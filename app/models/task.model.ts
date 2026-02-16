import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.ts";

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