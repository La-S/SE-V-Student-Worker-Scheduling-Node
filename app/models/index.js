import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.js";
import Team from "./team.model.js";
import Workout from "./workout.model.js"
import Exercise from "./exercise.model.js"
import Set from "./set.model.js"
import ExerciseTemplate from "./exerciseTemplate.model.js";
import Session from "./session.model.js";
import UserStats from "./userStats.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.team = Team;
db.workout = Workout;
db.exercise = Exercise;
db.set = Set;
db.exerciseTemplate = ExerciseTemplate;
db.session = Session;
db.userStats = UserStats;

//users can be on many teams and teams have many users
db.user.belongsToMany(db.team,
    { through: "TeamUser" });
db.team.belongsToMany(db.user,
    { through: "TeamUser" });

//set has many exercises
db.exercise.hasMany(db.set,
    { foreignKey: { name: "exercise_id", allowNull: false }, onDelete: "CASCADE" });
db.set.belongsTo(db.exercise,
    { foreignKey: { name: "exercise_id", allowNull: false }, onDelete: "CASCADE" });

//an exercise template is used in many exercises
db.exerciseTemplate.hasMany(db.exercise,
    { foreignKey: { name: "exercise_template_id", allowNull: false }, onDelete: "CASCADE" });
db.exercise.belongsTo(db.exerciseTemplate,
    { foreignKey: { name: "exercise_template_id", allowNull: false }, onDelete: "CASCADE" });

//a workout has many exercises
db.workout.hasMany(db.exercise,
    { foreignKey: { name: "workout_id", allowNull: false }, onDelete: "CASCADE" });
db.exercise.belongsTo(db.workout,
    { foreignKey: { name: "workout_id", allowNull: false }, onDelete: "CASCADE" });

//two users are tied to each workout, coach and user. 
db.user.hasMany(db.workout,
    { foreignKey: { name: "user_id", allowNull: false }, onDelete: "CASCADE" });
db.workout.belongsTo(db.user,
    { foreignKey: { name: "user_id", allowNull: false }, onDelete: "CASCADE" });
db.user.hasMany(db.workout,
    { foreignKey: "coach_id" });
db.workout.belongsTo(db.user,
    { foreignKey: "coach_id" });

//a user has many sessions
db.user.hasMany(db.session,
    { foreignKey: { name: "user_id", allowNull: false }, onDelete: "CASCADE" });
db.session.belongsTo(db.user,
    { foreignKey: { name: "user_id", allowNull: false }, onDelete: "CASCADE" });
//user stats per user
db.user.hasMany(db.userStats,
    { foreignKey: { name: "user_Id", allowNull: false }, onDelete: "CASCADE" });
db.userStats.belongsTo(db.user,
    { foreignKey: { name: "user_Id", allowNull: false }, onDelete: "CASCADE" });

db.team.hasMany(db.workout, 
    { foreignKey: { name: "team_id", allowNull: true }, onDelete: "CASCADE" });
db.workout.belongsTo(db.team,
    { foreignKey: { name: "team_id", allowNull: true }, onDelete: "CASCADE" });

db.sequelize.sync({alter: true});
export default db;
