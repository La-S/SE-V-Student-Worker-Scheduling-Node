import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const Workout = SequelizeInstance.define("workout", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    parent_id: {
        type: Sequelize.INTEGER
    },
    notes: {
        type: Sequelize.STRING(500)
    },
    expected_date: {
        type: Sequelize.DATEONLY
    },
    date: {
        type: Sequelize.DATEONLY
    },
    total_time: {
        type: Sequelize.INTEGER
    },
    focus_area: {
        type: Sequelize.STRING(50)
    }
});

export default Workout;