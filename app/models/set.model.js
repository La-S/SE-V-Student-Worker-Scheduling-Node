import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const allowedUnits = ['mi', 'm', 'km', 'feet', 'laps'];
//exercise_id added in index.js
const Set = SequelizeInstance.define("set", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  completed: {
    type: Sequelize.BOOLEAN
  },
  goal_weight: {
    type: Sequelize.INTEGER,
  },
  goal_reps: {
    type: Sequelize.INTEGER,
  },
  goal_time: {
    type: Sequelize.INTEGER,
  },
  goal_dist: {
    type: Sequelize.FLOAT,
  },
  actual_weight: {
    type: Sequelize.INTEGER,
  },
  actual_reps: {
    type: Sequelize.INTEGER,
  },
  actual_time: {
    type: Sequelize.INTEGER,
  },
  actual_dist: {
    type: Sequelize.FLOAT,
  },
  dist_units: {
    type: Sequelize.ENUM(allowedUnits),
    validate: {
      isIn: {
        args: [allowedUnits],
        msg: "distance_units not allowed. Valid distance units are mi, m, km, feet, laps"
      }
    }
  }
});

export default Set;
