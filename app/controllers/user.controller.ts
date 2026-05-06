import db from "../models/index.ts";
const User = db.User;
import { Model, Op } from 'sequelize';
import { type Request, type Response } from 'express';
import type { UserType } from "../types/user.type.ts";
import { getMessaging } from "firebase-admin/messaging";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import { getOneForId, createDateFromString, getStringFromDate, getSundayOfWeek, getSaturdayOfWeek, toHours } from "../services/services.ts";
import { getShiftsForDateRange } from "./employee.controller.ts";
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

const errorClassName = "User";

// Create and Save a new User
export async function create(req: Request, res: Response) {
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
}

export async function findOne(req: Request, res: Response) {
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

export async function findAll(req: Request, res: Response) {
  const data = await User.findAll({ order: [["lastName", "asc"]] });
  res.send(data);
}

// Find a single User with an email
export async function findByEmail(req: Request, res: Response) {
  const email = req.params.email;
  const data = await getUserForEmail(email);
  if (!data) {
    throw new AppError(404, `User for email: ${email} not found`);
  }
  res.send(data);
}

// Update a User by the id in the request
export async function update(req: Request, res: Response) {
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
    // console.log("subscribing to topic all-users!");
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
}


export async function updateIsAdmin(req: Request, res: Response) {
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

export async function findActiveEmployeesForUser(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const data = await Employee.findAll({ where: { userId: id, currentlyEmployed: true } });
  res.send(data);
}

export async function findEmployeesForUser(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const data = await Employee.findAll({ where: { userId: id } });
  res.send(data);
}

export async function findShiftsForDateRange(req: Request, res: Response) {
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

export async function findAvailabilityTemplates(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await getOneForId(User, id);
  const data = await AvailabilityTemplate.findAll({ where: { userId: id } });
  res.send(data);
}

export async function findAvailabilityTemplatesForSemester(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const semester = req.params.semester;

  const data = await AvailabilityTemplate.findAll({ where: { userId: id, semester: semester } });
  res.send(data);
}

export async function clearAvailabilityTemplatesForSemester(req: Request, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  const user = await getOneForId(User, id);
  const userId = id;
  const semester = req.params.semester;
  await AvailabilityTemplate.destroy({ where: { userId: id, semester: semester } })
  res.send({ message: `Availability Templates for semester ${semester} cleared!` });
}

export async function clearAvailabilityTemplates(req: Request, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  const userId = id;
  await AvailabilityTemplate.destroy({ where: { userId: id } })
  res.send({ message: `Availability Templates cleared!` });
}

export async function findLikeEmail(req: Request, res: Response) {
  const email = req.params.email;
  const data = await User.findAll({
    where: {
      email: { [Op.like]: `%${email}%` }
    },
    include: [Employee],
  });
  res.send(data);
}


export async function getUpcomingOpenCoverRequests(req: Request, res: Response) {
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
  const data = await CoverRequest.findAll({
    where: { accepterId: null },
    include: includeCondition
  });
  res.send(data);
}

export async function getAnnouncementReceipts(req: Request, res: Response) {
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

export async function getTimeOffRequests(req: Request, res: Response) {
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

export async function getHoursForWeek(req: Request, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  const user = await getOneForId(User,id);
  const expectedTotalHours = await getUserExpectedHoursForWeek(id, req.params.startdate);
  res.send({ expectedTotalHours: expectedTotalHours });
}

export async function getUserExpectedHoursForWeek(userId: number, queryDate: string): Promise<number> {
  const user = await getOneForId(User, userId);
  const employees: Model[] = await user.getEmployees();
  const employeeIds: number[] = [];
  const dateObj: Date = createDateFromString(queryDate);
  const startDateObj: Date = getSundayOfWeek(dateObj);
  const endDateObj: Date = getSaturdayOfWeek(dateObj);
  const startDate: string = getStringFromDate(startDateObj);
  const endDate: string = getStringFromDate(endDateObj);
  const shifts: Model[] = [];
  let expectedTotalHours: number = 0;
  for (const employee of employees) {
    const employeeShifts: Model[] = await getShiftsForDateRange(employee.dataValues.id, startDate, endDate);
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
export async function getUserFiles(req: Request, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  const user = await getOneForId(User, id);
  const data = await UserFile.findAll({ where: { userId: id } });
  res.send(data);
}

export async function getSingleSettingValue(req: Request, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  await getOneForId(User, id);
  await getOneForStringId(Setting, req.params.code);
  const userId = parseInt(req.params.id as string, 10);
  const settingCode = req.params.code as string;
  const settingValue = await getUserSettingValue(userId, settingCode);
  res.send(settingValue);
}

export async function getAllSettingsValues(req: Request, res: Response) {
  const id = parseInt(req.params.id as string, 10);
  await getOneForId(User, id);
  const data: Model<any, any>[] = [];
  const userSettings = await UserSettingValue.findAll({
    where: {
      userId: id,
    }
  });
  for (const userSettingValue of userSettings) {
    const settingValue = await getUserSettingValue(id, userSettingValue.dataValues.settingCode);
    data.push(settingValue);
  }
  res.send(data);
}

