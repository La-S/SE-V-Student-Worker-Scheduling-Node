import dbConfig from "../config/db.config.ts";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.ts";

// Models

import User from "./user.model.ts";
import Session from "./session.model.ts";
import BusinessUnit from "./businessunit.model.ts";
import Employee from "./employee.model.ts"

const db = {
    Sequelize,
    sequelize,
    User,
    Session,
    BusinessUnit,
    Employee
};

//users can be on many teams and teams have many users
// db.user.belongsToMany(db.team,
//     { through: "TeamUser" });
// db.team.belongsToMany(db.user,
//     { through: "TeamUser" });

// a user has many sessions
db.User.hasMany(db.Session,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.Session.belongsTo(db.User,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });

//User can be many employees
db.User.hasMany(db.Employee,
    {foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.Employee.belongsTo(db.User,
        { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });

//BusinessUnit has many employees
db.BusinessUnit.hasMany(db.Employee,
    {foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Employee.belongsTo(db.BusinessUnit,
        {foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });


//db.sequelize.sync({force: true});
db.sequelize.sync({alter: true});


// db.sequelize.sync({force: true});

export default db;