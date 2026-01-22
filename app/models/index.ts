import dbConfig from "../config/db.config.js";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.js";

// Models

import User from "./user.model.ts";
import Session from "./session.model.js";


const db = {
    Sequelize,
    sequelize,
    User,
    Session,
};

//users can be on many teams and teams have many users
// db.user.belongsToMany(db.team,
//     { through: "TeamUser" });
// db.team.belongsToMany(db.user,
//     { through: "TeamUser" });

// a user has many sessions
db.User.hasMany(db.Session,
    { foreignKey: { name: "userID", allowNull: false }, onDelete: "CASCADE" });
db.Session.belongsTo(db.User,
    { foreignKey: { name: "userID", allowNull: false }, onDelete: "CASCADE" });


// db.sequelize.sync({force: true});
db.sequelize.sync({alter: true});


// db.sequelize.sync({force: true});

export default db;