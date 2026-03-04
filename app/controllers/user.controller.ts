import db from "../models/index.ts";
const User = db.User;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import type { UserType } from "../types/user.type.ts";
import { getMessaging } from "firebase-admin/messaging";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";
import { getOneForId } from "../services/services.ts";
import Employee from "../models/employee.model.ts";
import Shift from "../models/shift.model.ts";
import Position from "../models/position.model.ts";
import Task from "../models/task.model.ts";
import TaskCompletion from "../models/taskcompletion.model.ts";
import TaskList from "../models/tasklist.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import AvailabilityTemplate from "../models/availabilitytemplate.model.ts";

const exports: any = {};
const errorClassName = "User";

// Create and Save a new User
exports.create = async (req: pkg.Request, res: pkg.Response) => {
  if (req.body.email && await getUserForEmail(req.body.email)) {
    throw new AppError(409, `user with email ${req.body.email} already exists. Use a different email.`)
  }

  // Save User in the database
  const data = await User.create(req.body);
  res.send(data);
};



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
    logging: console.log,
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
    const data = await AvailabilityTemplate.findAll({where: {userId: id}});
    res.send(data);
}


export default exports;
