import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.js";
// import Team from "./team.model.js";
import Session from "./session.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
// db.team = Team;
db.session = Session;

//users can be on many teams and teams have many users
// db.user.belongsToMany(db.team,
//     { through: "TeamUser" });
// db.team.belongsToMany(db.user,
//     { through: "TeamUser" });

// a user has many sessions
db.user.hasMany(db.session,
    { foreignKey: { name: "user_id", allowNull: false }, onDelete: "CASCADE" });
db.session.belongsTo(db.user,
    { foreignKey: { name: "user_id", allowNull: false }, onDelete: "CASCADE" });

// db.sequelize.sync({force: true});
// db.sequelize.sync({alter: true});


db.sequelize.sync({force: true});

export default db;
