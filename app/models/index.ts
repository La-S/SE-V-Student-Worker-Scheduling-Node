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
import TaskList from "./tasklist.model.ts";
import Task from "./task.model.ts";
import TaskCompletion from "./taskcompletion.model.ts";
import AvailabilityTemplate from "./availabilitytemplate.model.ts";
import CoverRequest from "./coverrequest.model.ts"
import DropRequest from "./droprequest.model.ts"
import OpenHours from "./openhours.model.ts";
import Settings from "./settings.model.ts";
import Announcement from "./announcement.model.ts";
import AnnouncementReceipt from "./announcementreceipt.model.ts";
import AnnouncementFile from "./announcementfile.model.ts";
import UserFile from "./userfile.model.ts"
import File from "./file.model.ts"

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
    WeeklyScheduleTemplate,
    TaskList,
    Task,
    TaskCompletion,
    AvailabilityTemplate,
    CoverRequest,
    DropRequest,
    OpenHours,
    Announcement,
    AnnouncementReceipt,
    AnnouncementFile,
    File,
    UserFile,
    Settings
};

//User-owned FKs
db.User.hasMany(db.Session,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.Session.belongsTo(db.User,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.User.hasMany(db.Employee,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.Employee.belongsTo(db.User,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.User.hasMany(db.AvailabilityTemplate,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.AvailabilityTemplate.belongsTo(db.User,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.User.hasMany(db.UserFile,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });
db.UserFile.belongsTo(db.User,
    { foreignKey: { name: "userId", allowNull: false }, onDelete: "CASCADE" });

//BusinessUnit-owned FKs
db.BusinessUnit.hasMany(db.Employee,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Employee.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.BusinessUnit.hasMany(db.Shift,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Shift.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.BusinessUnit.hasMany(db.Position,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Position.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.BusinessUnit.hasMany(db.WeeklyScheduleTemplate,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.WeeklyScheduleTemplate.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.BusinessUnit.hasMany(db.TaskList,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.TaskList.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.BusinessUnit.hasMany(db.OpenHours,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.OpenHours.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.BusinessUnit.hasMany(db.Announcement,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });
db.Announcement.belongsTo(db.BusinessUnit,
    { foreignKey: { name: "businessUnitId", allowNull: false }, onDelete: "CASCADE" });

//Employee-owned FKs
db.Employee.hasMany(db.Shift,
    { foreignKey: { name: "employeeId", allowNull: true }, onDelete: "CASCADE" });
db.Shift.belongsTo(db.Employee,
    { foreignKey: { name: "employeeId", allowNull: true }, onDelete: "CASCADE" });
db.Employee.hasMany(db.TaskCompletion,
    { foreignKey: { name: "checkedOffEmployeeId", allowNull: true }, onDelete: "CASCADE" });
db.TaskCompletion.belongsTo(db.Employee,
    { foreignKey: { name: "checkedOffEmployeeId", allowNull: true }, onDelete: "CASCADE" });
db.Employee.belongsToMany(db.Position, { through: "employees-positions" });
db.Position.belongsToMany(db.Employee, { through: "employees-positions" });
db.Employee.hasMany(db.AnnouncementReceipt,
    { foreignKey: { name: "employeeId", allowNull: false }, onDelete: "CASCADE" });
db.AnnouncementReceipt.belongsTo(db.Employee,
    { foreignKey: { name: "employeeId", allowNull: false }, onDelete: "CASCADE" });
db.Employee.hasMany(db.Announcement,
    { foreignKey: { name: "authorId", allowNull: false }, onDelete: "CASCADE" });
db.Announcement.belongsTo(db.Employee,
    { foreignKey: { name: "authorId", allowNull: false }, onDelete: "CASCADE" });

db.Employee.hasMany(db.CoverRequest,
    { foreignKey: { name: "requesterId", allowNull: false }, onDelete: "CASCADE", as: "requesterCoverRequests" });
db.CoverRequest.belongsTo(db.Employee,
    { foreignKey: { name: "requesterId", allowNull: false }, onDelete: "CASCADE", as: "coverRequester" });
db.Employee.hasMany(db.CoverRequest,
    { foreignKey: { name: "accepterId", allowNull: true }, onDelete: "CASCADE", as: "accepterCoverRequests" });
db.CoverRequest.belongsTo(db.Employee,
    { foreignKey: { name: "accepterId", allowNull: true }, onDelete: "CASCADE", as: "coverAccepter" });
db.Employee.hasMany(db.CoverRequest,
    { foreignKey: { name: "reviewedBy", allowNull: true }, onDelete: "CASCADE", as: "reviewerCoverRequests" });
db.CoverRequest.belongsTo(db.Employee,
    { foreignKey: { name: "reviewedBy", allowNull: true }, onDelete: "CASCADE", as: "coverReviewer" });

db.Employee.hasMany(db.DropRequest,
    { foreignKey: { name: "requesterId", allowNull: false }, onDelete: "CASCADE", as: "requesterDropRequests" });
db.DropRequest.belongsTo(db.Employee,
    { foreignKey: { name: "requesterId", allowNull: false }, onDelete: "CASCADE", as: "dropRequester" });
db.Employee.hasMany(db.DropRequest,
    { foreignKey: { name: "reviewedBy", allowNull: true }, onDelete: "CASCADE", as: "reviewerDropRequests" });
db.DropRequest.belongsTo(db.Employee,
    { foreignKey: { name: "reviewedBy", allowNull: true }, onDelete: "CASCADE", as: "dropReviewer" });

//Position-owned FK
db.Position.hasMany(db.Shift,
    { foreignKey: { name: "positionId", allowNull: true }, onDelete: "CASCADE" });
db.Shift.belongsTo(db.Position,
    { foreignKey: { name: "positionId", allowNull: true }, onDelete: "CASCADE" });

//shift fks
db.Shift.hasMany(db.TaskCompletion,
    { foreignKey: { name: "shiftId", allowNull: false }, onDelete: "CASCADE" });
db.TaskCompletion.belongsTo(db.Shift,
    { foreignKey: { name: "shiftId", allowNull: false }, onDelete: "CASCADE" });
db.Shift.belongsToMany(db.TaskList, { through: "shifts-tasklists", as: "taskList" });
db.TaskList.belongsToMany(db.Shift, { through: "shifts-tasklists", as: "shift" });
db.Shift.hasMany(db.CoverRequest,
    { foreignKey: { name: "shiftId", allowNull: false }, onDelete: "CASCADE" });
db.CoverRequest.belongsTo(db.Shift,
    { foreignKey: { name: "shiftId", allowNull: false }, onDelete: "CASCADE" });
db.Shift.hasMany(db.DropRequest,
    { foreignKey: { name: "shiftId", allowNull: false }, onDelete: "CASCADE" });
db.DropRequest.belongsTo(db.Shift,
    { foreignKey: { name: "shiftId", allowNull: false }, onDelete: "CASCADE" });


//TaskList FK
db.TaskList.hasMany(db.Task,
    { foreignKey: { name: "taskListId", allowNull: false }, onDelete: "CASCADE" });
db.Task.belongsTo(db.TaskList,
    { foreignKey: { name: "taskListId", allowNull: false }, onDelete: "CASCADE" });

//taskFK
db.Task.hasMany(db.TaskCompletion,
    { foreignKey: { name: "taskId", allowNull: false }, onDelete: "CASCADE" });
db.TaskCompletion.belongsTo(db.Task,
    { foreignKey: { name: "taskId", allowNull: false }, onDelete: "CASCADE" });


//weekly/dailyScheduleTemplate FKs
db.WeeklyScheduleTemplate.hasMany(db.DailyScheduleTemplate,
    { foreignKey: { name: "weeklyScheduleTemplateId", allowNull: false }, onDelete: "CASCADE" });
db.DailyScheduleTemplate.belongsTo(db.WeeklyScheduleTemplate,
    { foreignKey: { name: "weeklyScheduleTemplateId", allowNull: false }, onDelete: "CASCADE" });

//DailyScheduleTemplate FKs
db.DailyScheduleTemplate.hasMany(db.Shift,
    { foreignKey: { name: "dailyScheduleTemplateId", allowNull: true }, onDelete: "CASCADE" });
db.Shift.belongsTo(db.DailyScheduleTemplate,
    { foreignKey: { name: "dailyScheduleTemplateId", allowNull: true }, onDelete: "CASCADE" });

//Announcement FK
db.Announcement.hasMany(db.AnnouncementReceipt,
    { foreignKey: { name: "announcementId", allowNull: false }, onDelete: "CASCADE" });
db.AnnouncementReceipt.belongsTo(db.Announcement,
    { foreignKey: { name: "announcementId", allowNull: false }, onDelete: "CASCADE" });
db.Announcement.hasMany(db.AnnouncementFile,
    { foreignKey: { name: "announcementId", allowNull: false }, onDelete: "CASCADE" });
db.AnnouncementFile.belongsTo(db.Announcement,
    { foreignKey: { name: "announcementId", allowNull: false }, onDelete: "CASCADE" });

//File FKs
db.File.hasMany(db.UserFile,
    { foreignKey: { name: "fileId", allowNull: false }, onDelete: "CASCADE" });
db.UserFile.belongsTo(db.File,
    { foreignKey: { name: "fileId", allowNull: false }, onDelete: "CASCADE" });
db.File.hasMany(db.AnnouncementFile,
    { foreignKey: { name: "fileId", allowNull: false }, onDelete: "CASCADE" });
db.AnnouncementFile.belongsTo(db.File,
    { foreignKey: { name: "fileId", allowNull: false }, onDelete: "CASCADE" });

// db.sequelize.sync({force: true});
db.sequelize.sync({ alter: true });


// db.sequelize.sync({force: true});

export default db;