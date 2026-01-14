import Sequelize from "sequelize";
import SequelizeInstance from "../config/sequelizeInstance.js";

const allowedTypes = ["strength", "cardio", "mobility", "other"]
const allowedMuscles = ["bicep", "tricep", "forearm", "shoulder", "back", "chest", "core", "quad", "hamstring", "calf", "glute", "other"]
const ExerciseTemplate = SequelizeInstance.define("exerciseTemplate", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING(100),
  },
  type: {
    type: Sequelize.ENUM(allowedTypes),
    validate: {
      isIn: {
        args: [allowedTypes],
        msg: 'Type not allowed. Allowed types are: strength, cardio, mobility, and other'
      }
    }
  },
  muscle_group: {
    type: Sequelize.ENUM(allowedMuscles),
    validate: {
      isIn: {
        args: [allowedMuscles],
        msg: 'Muscle group not allowed. Allowed muscle groups are bicep, tricep, forearm, shoulder, back, chest, core, quad, hamstring, calf, glute, and other'
      }
    }
  },
});

export default ExerciseTemplate;
