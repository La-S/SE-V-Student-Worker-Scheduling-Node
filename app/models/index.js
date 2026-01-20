import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.js";
import PushToken from "./pushToken.model.js";
import Session from "./session.model.js";


const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = User;
db.pushToken = PushToken;
db.session = Session;

//users can be on many teams and teams have many users
// db.user.belongsToMany(db.team,
//     { through: "TeamUser" });
// db.team.belongsToMany(db.user,
//     { through: "TeamUser" });

// a user has many sessions
db.user.hasMany(db.session,
    { foreignKey: { name: "userID", allowNull: false }, onDelete: "CASCADE" });
db.session.belongsTo(db.user,
    { foreignKey: { name: "userID", allowNull: false }, onDelete: "CASCADE" });


// a user has many sessions
db.user.hasMany(db.pushToken,
    { foreignKey: { name: "userID", allowNull: false }, onDelete: "CASCADE" });
db.pushToken.belongsTo(db.user,
    { foreignKey: { name: "userID", allowNull: false }, onDelete: "CASCADE" });


// db.sequelize.sync({force: true});
db.sequelize.sync({alter: true});


// db.sequelize.sync({force: true});

export default db;
