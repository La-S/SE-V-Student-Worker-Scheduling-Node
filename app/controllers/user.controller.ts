import db from "../models/index.ts";
const User = db.User;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import type { UserValuesType } from "../types/user.type.ts";
import { getMessaging } from "firebase-admin/messaging";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import { getOneForId, createDateFromString, getStringFromDate, getSundayOfWeek, getSaturdayOfWeek, toHours, getOneForStringId } from "../services/services.ts";
import { getShiftsForDateRange } from "./employee.controller.ts";
import Employee, { EmployeeType } from "../models/employee.model.ts";
import Shift, { ShiftType } from "../models/shift.model.ts";
import Position, { PositionType } from "../models/position.model.ts";
import Task from "../models/task.model.ts";
import TaskCompletion from "../models/taskcompletion.model.ts";
import TaskList from "../models/tasklist.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import AvailabilityTemplate, { AvailabilityTemplateType } from "../models/availabilitytemplate.model.ts";
import CoverRequest, { CoverRequestType } from '../models/coverrequest.model.ts';
import DropRequest from '../models/droprequest.model.ts';
import Announcement from "../models/announcement.model.ts";
import AnnouncementReceipt, { AnnouncementReceiptType } from "../models/announcementreceipt.model.ts";
import UserFile, { UserFileType } from "../models/userfile.model.ts";
import AnnouncementFile from "../models/announcementfile.model.ts";
import Timeclock from "../models/timeclock.model.ts";
import UserSettingValue, { UserSettingValueType } from "../models/usersettingvalue.model.ts";
import { getUserSettingValue } from "./usersettingvalue.controller.ts";
import Setting, { SettingType } from "../models/setting.model.ts";
import TimeOffRequest, { TimeOffRequestType } from "../models/timeoffrequest.model.ts";
import { UserType } from "../models/user.model.ts";

const exports: any = {};
const errorClassName: string = "User";

// Create and Save a new User
exports.create = async (req: pkg.Request, res: pkg.Response) => {
  if (req.body.email && await getUserForEmail(req.body.email)) {
    throw new AppError(409, `user with email ${req.body.email} already exists. Use a different email.`)
  }

  // Save User in the database
  const data: UserType = await User.create(req.body);
  const settings: SettingType[] = await Setting.findAll({ where: { isForBusinessUnit: false } });
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
  const data: UserType | null = await User.findOne({
    where: { id: id },
    include: [UserFile]
  });
  if (!data) {
    throw new NotFoundError("User", id);
  }
  res.send(data);
}

exports.findAll = async (req: pkg.Request, res: pkg.Response) => {
  const data: UserType[] = await User.findAll({ order: [["lastName", "asc"]] });
  res.send(data);
}

// Find a single User with an email
exports.findByEmail = async (req: pkg.Request, res: pkg.Response) => {
  const email: string = req.params.email;
  const data: UserType | false = await getUserForEmail(email);
  if (!data) {
    throw new AppError(404, `User for email: ${email} not found`);
  }
  res.send(data);
};

// Update a User by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  if (req.body.email) {
    let userForEmail: UserType | false = await getUserForEmail(req.body.email)
    let userForId: UserType = await getOneForId(User, id)
    if (userForEmail && (JSON.stringify(userForEmail) !== JSON.stringify(userForId))) {
      throw new AppError(409, `${req.body.email} is already in use by another user. Use a different email.`)
    }
    if (req.body.isAdmin) {
      throw new AppError(400, "isAdmin cannot be changed from this endpoint, please use PUT user/:id/role");
    }
  }

  if (req.body.pushToken) {
    // console.log("subscribing to topic all-users!");
    await getMessaging().subscribeToTopic(req.body.pushToken, 'all-users');
  }

  const numUpdated: number[] = await User.update(req.body, {
    where: { id: id },
  })
  if (numUpdated[0] <= 0) {
    throw new AppError(400, `Unable to update user with id ${id}. Check request body`)
  }
  const updatedUser: UserType = await getOneForId(User, id);
  res.send(updatedUser);
};


exports.updateIsAdmin = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  const numUpdated: number[] = await User.update(req.body, {
    where: { id: id },
  })
  if (numUpdated[0] <= 0) {
    throw new AppError(400, `Update for id ${id} failed. Check request body.`)
  }
  const updatedUser: UserType = await getOneForId(User, id);
  res.send(updatedUser);
}


async function getUserForEmail(email: string): Promise<UserType | false> {
  const data: UserType | null = await User.findOne({
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
  const id: number = parseInt(req.params.id, 10);

  const data: EmployeeType[] = await Employee.findAll({ where: { userId: id, currentlyEmployed: true } });
  res.send(data);
};

exports.findEmployeesForUser = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id, 10);

  const data: EmployeeType[] = await Employee.findAll({ where: { userId: id } });
  res.send(data);
};

exports.findShiftsForDateRange = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id, 10);
  //should provide date foe central time. CA format is YYYY-mm-dd
  const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  let startDate: string = req.query.start as string ?? today;
  let endDate: string = req.query.end as string ?? today;

  await getOneForId(User, id);

  let employeesForUser: EmployeeType[] = await Employee.findAll({ where: { userId: id } });
  if (!employeesForUser) {
    throw new AppError(404, `Employees not found for user with id ${id}`)
  }

  let employeeIds = employeesForUser.map((employee: EmployeeType) => {
    return employee.dataValues.id
  })


  const data: ShiftType[] = await Shift.findAll({
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
  const id: number = parseInt(req.params.id, 10);
  await getOneForId(User, id);
  const data: AvailabilityTemplateType[] = await AvailabilityTemplate.findAll({ where: { userId: id } });
  res.send(data);
}

exports.findAvailabilityTemplatesForSemester = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id, 10);
  const semester: string = req.params.semester;

  const data: AvailabilityTemplateType[] = await AvailabilityTemplate.findAll({ where: { userId: id, semester: semester } });
  res.send(data);
}

exports.clearAvailabilityTemplatesForSemester = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  const user: UserType = await getOneForId(User, id);
  const userId: number = id;
  const semester: string = req.params.semester;
  await AvailabilityTemplate.destroy({ where: { userId: id, semester: semester } })
  res.send({ message: `Availability Templates for semester ${semester} cleared!` });
}

exports.clearAvailabilityTemplates = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  const userId: number = id;
  await AvailabilityTemplate.destroy({ where: { userId: id } })
  res.send({ message: `Availability Templates cleared!` });
}

exports.findLikeEmail = async (req: pkg.Request, res: pkg.Response) => {
  const email: string = req.params.email;
  const data: UserType[] = await User.findAll({
    where: {
      email: { [Op.like]: `%${email}%` }
    },
    include: [Employee],
  });
  res.send(data);
}


exports.getUpcomingOpenCoverRequests = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  const user: UserType = await getOneForId(User, id);
  //@ts-ignore
  const employeesForUser: EmployeeType[] = await user.getEmployees();
  const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });
  const businessUnitIds: number[] = employeesForUser.map((employee) => { return employee.dataValues.businessUnitId });

  const combinedPositions: number[] = [];
  for (const employee of employeesForUser) {
    //@ts-ignore
    const positions: PositionType[] = await employee.getPositions();
    for (const position of positions) {
      combinedPositions.push(position.dataValues.id);
    }
  }

  const includeCondition = [
    { model: Employee, as: "coverRequester", required: false, include: [User] },
    { model: Employee, as: "coverAccepter", required: false, include: [User] },
    { model: Employee, as: "coverReviewer", required: false, include: [User] },
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
  const data: CoverRequestType[] = await CoverRequest.findAll({
    where: { accepterId: null },
    include: includeCondition
  });
  res.send(data);
}

exports.getAnnouncementReceipts = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  const user: UserType = await getOneForId(User, id);
  //@ts-ignore
  const employeesForUser: EmployeeType[] = await user.getEmployees();
  const employeeIds: number[] = [];
  for (const employee of employeesForUser) {
    employeeIds.push(employee.dataValues.id);
  }

  const today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
  const currentTime: string = new Date().toLocaleTimeString("en-US", { timeZone: 'America/Chicago', hour12: false });

  const data: AnnouncementReceiptType[] = await AnnouncementReceipt.findAll({
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
  const id: number = parseInt(req.params.id as string, 10);
  const user: UserType = await getOneForId(User, id);
  //@ts-ignore
  const employeesForUser: EmployeeType[] = await user.getEmployees();
  const employeeIds: number[] = [];
  for (const employee of employeesForUser) {
    employeeIds.push(employee.dataValues.id);
  }
  const data: TimeOffRequestType[] = await TimeOffRequest.findAll({ where: { requesterId: { [Op.in]: employeeIds } }, order: [["startDate", "desc"]] });
  res.send(data);
}

exports.getHoursForWeek = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  const user: UserType = await getOneForId(User, id);
  const expectedTotalHours: number = await getUserExpectedHoursForWeek(id, req.params.startdate);
  res.send({ expectedTotalHours: expectedTotalHours });
}

export async function getUserExpectedHoursForWeek(userId: number, queryDate: string): Promise<number> {
  const user: UserType = await getOneForId(User, userId);
  //@ts-ignore
  const employees: EmployeeType[] = await user.getEmployees();
  const employeeIds: number[] = [];
  const dateObj: Date = createDateFromString(queryDate);
  const startDateObj: Date = getSundayOfWeek(dateObj);
  const endDateObj: Date = getSaturdayOfWeek(dateObj);
  const startDate: string = getStringFromDate(startDateObj);
  const endDate: string = getStringFromDate(endDateObj);
  const shifts: ShiftType[] = [];
  let expectedTotalHours: number = 0;
  for (const employee of employees) {
    const employeeShifts: ShiftType[] = await getShiftsForDateRange(employee.dataValues.id, startDate, endDate);
    for (const shift of employeeShifts) {
      shifts.push(shift);
    }
  }

  for (const shift of shifts) {
    const startTime: string = shift.dataValues.startTime;
    const endTime: string = shift.dataValues.endTime;
    //difference in ms -> hours
    const timeDiff: number = toHours(endTime) - toHours(startTime);
    expectedTotalHours += timeDiff;
  }
  return expectedTotalHours;
}
exports.getUserFiles = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  const user: UserType = await getOneForId(User, id);
  const data: UserFileType[] = await UserFile.findAll({ where: { userId: id } });
  res.send(data);
}

exports.getSingleSettingValue = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  await getOneForId(User, id);
  await getOneForStringId(Setting, req.params.code);
  const userId: number = parseInt(req.params.id as string, 10);
  const settingCode: string = req.params.code as string;
  const settingValue: any = await getUserSettingValue(userId, settingCode);
  res.send(settingValue);
}

exports.getAllSettingsValues = async (req: pkg.Request, res: pkg.Response) => {
  const id: number = parseInt(req.params.id as string, 10);
  await getOneForId(User, id);
  const data: UserSettingValueType[] = [];
  const userSettings = await UserSettingValue.findAll({
    where: {
      userId: id,
    }
  });
  for (const userSettingValue of userSettings) {
    const settingValue: UserSettingValueType = await getUserSettingValue(id, userSettingValue.dataValues.settingCode);
    data.push(settingValue);
  }
  res.send(data);
}

export default exports;
