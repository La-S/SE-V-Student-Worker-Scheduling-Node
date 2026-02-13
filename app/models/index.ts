import dbConfig from "../config/db.config.ts";
import { Sequelize } from "sequelize";
import sequelize from "../config/sequelizeInstance.ts";

// Models

import User from "./user.model.ts";
import Session from "./session.model.ts";
import BusinessUnit from "./businessunit.model.ts";
import Employee from "./employee.model.ts"
import Shift from "./shift.model.ts"
import Position from "./position.model.ts"
import DailyScheduleTemplate from "./dailyscheduletemplate.model.ts";
import WeeklyScheduleTemplate from "./weeklyscheduletemplate.model.ts";

const db = {
    Sequelize,
    sequelize,
    User,
    Session,
    BusinessUnit,
    Employee,
    Shift,
    Position,
    DailyScheduleTemplate,
    WeeklyScheduleTemplate
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
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.Employee.belongsTo(db.User,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });

//BusinessUnit has many employees
db.BusinessUnit.hasMany(db.Employee,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Employee.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });

//shift fks
db.BusinessUnit.hasMany(db.Shift,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Shift.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Employee.hasMany(db.Shift,
    { foreignKey: { name: "employeeId", allowNull: true }, onDelete: "CASCADE" });
db.Shift.belongsTo(db.Employee,
    { foreignKey: { name: "employeeId", allowNull: true }, onDelete: "CASCADE" });
db.Position.hasMany(db.Shift,
    { foreignKey: { name: "positionId", allowNull: true }, onDelete: "CASCADE" });
db.Shift.belongsTo(db.Position,
    { foreignKey: { name: "positionId", allowNull: true }, onDelete: "CASCADE" });
db.DailyScheduleTemplate.hasMany(db.Shift,
    { foreignKey: { name: "dailyScheduleTemplateId", allowNull: true }, onDelete: "CASCADE" });
db.Shift.belongsTo(db.DailyScheduleTemplate,
    { foreignKey: { name: "dailyScheduleTemplateId", allowNull: true }, onDelete: "CASCADE" });

//position FKs
db.BusinessUnit.hasMany(db.Position,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Position.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Employee.belongsToMany(db.Position, { through: "employees-positions" });
db.Shift.belongsToMany(db.Employee, { through: "employees-positions" });


//weekly/dailyScheduleTemplate FKs
db.WeeklyScheduleTemplate.hasMany(db.DailyScheduleTemplate,
    { foreignKey: { name: "weeklyScheduleTemplateId", allowNull: false }, onDelete: "CASCADE" });
db.DailyScheduleTemplate.belongsTo(db.WeeklyScheduleTemplate,
    { foreignKey: { name: "weeklyScheduleTemplateId", allowNull: false }, onDelete: "CASCADE" });
db.BusinessUnit.hasMany(db.WeeklyScheduleTemplate,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.WeeklyScheduleTemplate.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });


// db.sequelize.sync({force: true});
db.sequelize.sync({ alter: true });


// db.sequelize.sync({force: true});

export default db;