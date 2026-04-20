import db from "../models/index.ts";
const User = db.User;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import type { UserType } from "../types/user.type.ts";
import { getMessaging } from "firebase-admin/messaging";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import { getOneForId, getOneForStringId } from "../services/services.ts";
import Employee from "../models/employee.model.ts";
import Shift from "../models/shift.model.ts";
import Position from "../models/position.model.ts";
import Task from "../models/task.model.ts";
import TaskCompletion from "../models/taskcompletion.model.ts";
import TaskList from "../models/tasklist.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import AvailabilityTemplate from "../models/availabilitytemplate.model.ts";
import CoverRequest from '../models/coverrequest.model.ts';
import DropRequest from '../models/droprequest.model.ts';
import Announcement from "../models/announcement.model.ts";
import AnnouncementReceipt from "../models/announcementreceipt.model.ts";
import UserFile from "../models/userfile.model.ts";
import AnnouncementFile from "../models/announcementfile.model.ts";
import Timeclock from "../models/timeclock.model.ts";
import UserSettingValue from "../models/usersettingvalue.model.ts";
import { getUserSettingValue } from "./usersettingvalue.controller.ts";
import Setting from "../models/setting.model.ts";
import TimeOffRequest from "../models/timeoffrequest.model.ts";

const exports: any = {};
const errorClassName = "User";

// Create and Save a new User
exports.create = async (req: pkg.Request, res: pkg.Response) => {
  if (req.body.email && await getUserForEmail(req.body.email)) {
    throw new AppError(409, `user with email ${req.body.email} already exists. Use a different email.`)
  }

  // Save User in the database
  const data = await User.create(req.body);
  const settings = await Setting.findAll({ where: { isForBusinessUnit: false } });
  for (const setting of settings) {
    await UserSettingValue.create({
      userId: data.dataValues.id,
      settingCode: setting.dataValues.code,
      settingValue: setting.dataValues.defaultValue
    });
  }
  res.send(data);
};

exports.findOne = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  const data = await User.findOne({
    where: { id: id },
    include: [UserFile]
  });
  if (!data) {
    throw new NotFoundError("User", id);
  }
  res.send(data);
}

exports.findAll = async (req: pkg.Request, res: pkg.Response) => {
  const data = await User.findAll({ order: [["lastName", "asc"]] });
  res.send(data);
}

// Find a single User with an email
exports.findByEmail = async (req: pkg.Request, res: pkg.Response) => {
  const email = req.params.email;
  const data = await getUserForEmail(email);
  if (!data) {
    throw new AppError(404, `User for email: ${email} not found`);
  }
  res.send(data);
};

// Update a User by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (req.body.email) {
    let userForEmail = await getUserForEmail(req.body.email)
    let userForId = await getOneForId(User, id)
    if (userForEmail && (JSON.stringify(userForEmail) !== JSON.stringify(userForId))) {
      throw new AppError(409, `${req.body.email} is already in use by another user. Use a different email.`)
    }
    if (req.body.isAdmin) {
      throw new AppError(400, "isAdmin cannot be changed from this endpoint, please use PUT user/:id/role");
    }
  }

  if (req.body.pushToken) {
    console.log("subscribing to topic all-users!");
    await getMessaging().subscribeToTopic(req.body.pushToken, 'all-users');
  }

  const numUpdated = await User.update(req.body, {
    where: { id: id },
  })
  if (numUpdated[0] <= 0) {
    throw new AppError(400, `Unable to update user with id ${id}. Check request body`)
  }
  const updatedUser = await getOneForId(User, id);
  res.send(updatedUser);
};


exports.updateIsAdmin = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  const numUpdated = await User.update(req.body, {
    where: { id: id },
  })
  if (numUpdated[0] <= 0) {
    throw new AppError(400, `Update for id ${id} failed. Check request body.`)
  }
  const updatedUser = await getOneForId(User, id);
  res.send(updatedUser);
}


async function getUserForEmail(email: string) {
  const data = await User.findOne({
    where: { // could be this one
      email: email,
    },
  });
  if (!data) {
    return false;
  }
  return data;
}

exports.findActiveEmployeesForUser = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);

  const data = await Employee.findAll({ where: { userId: id, currentlyEmployed: true } });
  res.send(data);
};

exports.findEmployeesForUser = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);

  const data = await Employee.findAll({ where: { userId: id } });
  res.send(data);
};

exports.findShiftsForDateRange = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  //should provide date foe central time. CA format is YYYY-mm-dd
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  let startDate: string = req.query.start ?? today;
  let endDate: string = req.query.end ?? today;

  await getOneForId(User, id);

  let employeesForUser: Model<any, any>[] = await Employee.findAll({ where: { userId: id } });
  if (!employeesForUser) {
    throw new AppError(404, `Employees not found for user with id ${id}`)
  }

  let employeeIds = employeesForUser.map((employee: Model<any, any>) => {
    return employee.dataValues.id
  })


  const data = await Shift.findAll({
    where: {
      employeeId: { [Op.in]: employeeIds },
      date: { [Op.between]: [startDate, endDate] }
    },
    include: [{
      model: Position
    },
    {
      model: BusinessUnit
    },
    {
      model: CoverRequest
    },
    {
      model: DropRequest
    },
    {
      model: Timeclock
    },
    {
      model: TaskList,
      as: "taskList",
      include: [{
        model: Task,
        required: false,
        include: [{
          model: TaskCompletion,
          where: { shiftId: { [Op.col]: 'shift.id' } },
          required: false
        }]
      }]
    }]
  });
  res.send(data);
}

exports.findAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  await getOneForId(User, id);
  const data = await AvailabilityTemplate.findAll({ where: { userId: id } });
  res.send(data);
}

exports.findAvailabilityTemplatesForSemester = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  const semester = req.params.semester;

  const data = await AvailabilityTemplate.findAll({ where: { userId: id, semester: semester } });
  res.send(data);
}

exports.clearAvailabilityTemplatesForSemester = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  const user = await getOneForId(User, id);
  const userId = id;
  const semester = req.params.semester;
  await AvailabilityTemplate.destroy({ where: { userId: id, semester: semester } })
  res.send({ message: `Availability Templates for semester ${semester} cleared!` });
}

exports.clearAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  const userId = id;
  await AvailabilityTemplate.destroy({ where: { userId: id } })
  res.send({ message: `Availability Templates cleared!` });
}

exports.findLikeEmail = async (req: pkg.Request, res: pkg.Response) => {
  const email = req.params.email;
  const data = await User.findAll({
    where: {
      email: { [Op.like]: `%${email}%` }
    },
    include: [Employee],
  });
  res.send(data);
}


exports.getUpcomingOpenCoverRequests = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  const user = await getOneForId(User, id);
  const employeesForUser = await user.getEmployees();
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
  const businessUnitIds = employeesForUser.map((employee) => { return employee.dataValues.businessUnitId });

  const combinedPositions = [];
  for (const employee of employeesForUser) {
    const positions = await employee.getPositions();
    for (const position of positions) {
      combinedPositions.push(position.dataValues.id);
    }
  }

  const includeCondition = [
    { model: Employee, as: "coverRequester", include: [User] },
    { model: Employee, as: "coverAccepter", include: [User] },
    { model: Employee, as: "coverReviewer", include: [User] },
    {
      model: Shift,
      include: [Position, BusinessUnit],
      as: 'shift',
      required: true,
      where: {
        businessUnitId: { [Op.in]: businessUnitIds },
        positionId: { [Op.in]: combinedPositions },
        [Op.or]: [
          { date: { [Op.gt]: today } },
          {
            date: { [Op.eq]: today },
            startTime: { [Op.gte]: currentTime }
          }
        ],

      }
    }
  ];
  const data = await CoverRequest.findAll({
    where: { accepterId: null },
    include: includeCondition
  });
  res.send(data);
}

exports.getAnnouncementReceipts = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  const user = await getOneForId(User, id);
  const employeesForUser = await user.getEmployees();
  const employeeIds: number[] = [];
  for (const employee of employeesForUser) {
    employeeIds.push(employee.dataValues.id);
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

  const data = await AnnouncementReceipt.findAll({
    where: {
      employeeId: { [Op.in]: employeeIds },
      deleted: false
    },
    order: [
      [Announcement, "postAtDate", "desc"],
      [Announcement, "postAtTime", "desc"]
    ],
    include: [
      {
        model: Announcement,
        required: true,
        where: {
          [Op.or]: [
            { postAtDate: { [Op.lt]: today } },
            {
              postAtDate: today,
              postAtTime: { [Op.lte]: currentTime }
            }
          ]
        },
        include: [
          {
            model: Employee,
            include: [User]
          },
          {
            model: AnnouncementFile
          }
        ]
      }
    ]
  });
  res.send(data);
}

exports.getTimeOffRequests = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  const user = await getOneForId(User, id);
  const employeesForUser = await user.getEmployees();
  const employeeIds: number[] = [];
  for (const employee of employeesForUser) {
    employeeIds.push(employee.dataValues.id);
  }
  const data = await TimeOffRequest.findAll({ where: { requesterId: { [Op.in]: employeeIds } }, order: [["startDate", "desc"]] });
  res.send(data);
}

exports.getUserFiles = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  const user = await getOneForId(User, id);
  const data = await UserFile.findAll({ where: { userId: id } });
  res.send(data);
}

exports.getSingleSettingValue = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  await getOneForId(User, id);
  await getOneForStringId(Setting, req.params.code);
  const userId = parseInt(req.params.id as string, 10);
  const settingCode = req.params.code as string;
  const settingValue = await getUserSettingValue(userId, settingCode);
  res.send(settingValue);
}

exports.getAllSettingsValues = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id as string, 10);
  await getOneForId(User, id);
  const userId = parseInt(req.params.id as string, 10);
  const data: Model<any, any>[] = [];
  const userSettings = await UserSettingValue.findAll({
    where: {
      userId: userId,
    }
  });
  for (const userSettingValue of userSettings) {
    const settingValue = await getUserSettingValue(userId, userSettingValue.dataValues.settingCode);
    data.push(settingValue);
  }
  res.send(data);
}

export default exports;
