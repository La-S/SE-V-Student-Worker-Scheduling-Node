import db from "../models/index.ts";
import pkg from 'express';
import type { SessionValuesType } from "../types/session.type.ts";
import { UnauthorizedError } from "../error/unauthorized.error.ts";
import { AppError } from "../error/app.error.ts";
import { Op } from "sequelize";
import Employee from "../models/employee.model.ts";
import UserFile from "../models/userfile.model.ts";
import TimeOffRequest from "../models/timeoffrequest.model.ts";
import { logger } from "../logger/logger.ts";
import UserSettingValue from "../models/usersettingvalue.model.ts";


const Session = db.Session;

export const authenticate = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = getToken(req);
  let foundSession = await getSession(token);
  let sessionData = foundSession.dataValues as SessionValuesType;

  if (sessionData == null || sessionData.expirationDate.getTime() < Date.now()) {
    foundSession.set("token", null);
    foundSession.set("expirationDate", new Date());
    foundSession.save();
    throw new UnauthorizedError("Unauthorized! Expired Token, Logout and Login again");
  }

  next();
  return;
};

//AUTHORIZATION METHOD, DOES NOT REPLACE AUTHENTICATE
export const isAdminOnly = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = getToken(req);
  let foundSession = await getSession(token);
  let user = await (foundSession as any).getUser();
  if (user.dataValues.isAdmin !== true) {
    throw new UnauthorizedError("Unauthorized! User must be admin to perform this function")
  }
  next();
  return;
};

//AUTHORIZATION METHOD, DOES NOT REPLACE AUTHENTICATE
export const managerOrAdminOnly = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = getToken(req);
  let foundSession = await getSession(token);
  let user = await (foundSession as any).getUser();
  if (user.dataValues.isAdmin === true) {
    next();
    return;
  }
  let employeesForUser = await (user as any).getEmployees() as any[];
  let businessUnitsForManager = employeesForUser.filter((a) => { return a.dataValues.isManager === true && a.dataValues.currentlyEmployed === true }).map((a) => { return a.dataValues.businessUnitId });
  let isManagerAnywhere = businessUnitsForManager.length > 0;
  if (isManagerAnywhere === true) {
    if (req.body?.isAdmin) {
      // prevent privilege escalation
      req.body.isAdmin = false;
    }

    if (req.body?.isManager && !businessUnitsForManager.some((a) => { return a === req.body?.businessUnitId})) {
      // prevent privilege escalation
      logger.log("info", "A manager was blocked trying to create a manager in a different businessUnit.");
      req.body.isManager = undefined;
    }

    next();
    return;
  }

  throw new UnauthorizedError("Unauthorized! User must be admin or a manager to perform this function")
};


//AUTHORIZATION METHOD, DOES NOT REPLACE AUTHENTICATE

const AuthOption = {
  employee: "employee",
  businessUnit: "businessUnit",
  userfile: "userfile",
  user: "user",
  timeOffRequest: "timeOffRequest",
  userSettingsValue: "userSettingsValue"
}

export const authorizeById = (option: any) => {
  return async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
    let idToVerify = parseInt(req.params.id, 10);
    // console.log("Verifying: ", idToVerify)
    if (!idToVerify) {
      throw new UnauthorizedError("Unauthorized! User must have an ID to perform this function")
    }

    let token = getToken(req);
    let foundSession = await getSession(token);
    let user = await (foundSession as any).getUser();
    if (user.dataValues.isAdmin === true) {
      // console.log("is admin")
      next();
      return;
    }

    if (option == AuthOption.userSettingsValue) {
      let userSettingsValueTryingToAccess = await UserSettingValue.findByPk(idToVerify);
      if (!userSettingsValueTryingToAccess) {
        throw new AppError(404, "not found");
      }
      if (user.id === userSettingsValueTryingToAccess.dataValues.userId) {
        // this is the own user, let him edit
        next();
        return;
      }

      let employeesForRequestingUser = await (user as any).getEmployees();
      let managerPositions = employeesForRequestingUser.filter((a) => { return a.dataValues.isManager === true && a.dataValues.currentlyEmployed === true })
      for (let manager of managerPositions) {
        let isAuthorized = await isUserInBusinessUnit(userSettingsValueTryingToAccess.dataValues.userId, manager.dataValues.businessUnitId);
        if (isAuthorized) {
          next();
          return;
        }
      }
      throw new UnauthorizedError("Unauthorized! You are not allowed to access that info");
    }

    if (option == AuthOption.timeOffRequest) {
      let timeOffRequestTryingToAccess = await TimeOffRequest.findByPk(idToVerify);
      if (!timeOffRequestTryingToAccess) {
        throw new AppError(404, "request not found");
      }
      let employeesForRequestingUser = await (user as any).getEmployees();
      let isRequestForEmployee = employeesForRequestingUser.some((a) => { return a.dataValues.id === timeOffRequestTryingToAccess.dataValues.requesterId && a.dataValues.currentlyEmployed === true })

      if (isRequestForEmployee) {
        next();
        return;
      }
      // console.log(timeOffRequestTryingToAccess.dataValues);

      let managerPositions = employeesForRequestingUser.filter((a) => { return a.dataValues.isManager === true && a.dataValues.currentlyEmployed === true })
      for (let manager of managerPositions) {
        let isAuthorized = await isEmployeeInBusinessUnit(timeOffRequestTryingToAccess.dataValues.requesterId, manager.dataValues.businessUnitId);
        if (isAuthorized) {
          next();
          return;
        }
        // console.log("user is a manager but not allowed to view that data.")
      }

      throw new UnauthorizedError("Unauthorized! You are not allowed to access that user's info");
    }

    if (option == AuthOption.businessUnit) {
      let employeesForRequestingUser = await (user as any).getEmployees();
      let hasEmployeeInBusinessUnit = employeesForRequestingUser.some((a) => { return a.dataValues.businessUnitId === idToVerify && a.dataValues.currentlyEmployed === true })

      if (hasEmployeeInBusinessUnit) {
        // console.log("user is in businessUnit")
        next();
        return;
      }

      throw new UnauthorizedError("Unauthorized! You are not allowed to access that user's info");
    }

    if (option === AuthOption.user) {
      if (req.body?.isAdmin) {
        // prevent privilege escalation
        req.body.isAdmin = undefined;
      }

      if (user.dataValues.id === idToVerify) {
        // console.log("user is himself")
        next();
        return;
      }

      let employeesForRequestingUser = await (user as any).getEmployees();
      let managerPositions = employeesForRequestingUser.filter((a) => { return a.dataValues.isManager === true && a.dataValues.currentlyEmployed === true })
      for (let manager of managerPositions) {
        let isAuthorized = await isUserInBusinessUnit(idToVerify, manager.dataValues.businessUnitId);
        if (isAuthorized) {
          next();
          return;
        }
        // console.log("user is a manger but not allowed to view that data.")
      }

      throw new UnauthorizedError("Unauthorized! You are not allowed to access that user's info");
    }

    if (option === AuthOption.userfile) {
      let fileTryingToAccess = await UserFile.findOne({ where: { id: idToVerify } })
      if (!fileTryingToAccess) {
        throw new AppError(404, "file not found");
      }
      let employeesForUser = await (user as any).getEmployees();
      let managerPositions = employeesForUser.filter((a) => { return a.dataValues.isManager === true && a.dataValues.currentlyEmployed === true })
      for (let manager of managerPositions) {
        let isAuthorized = await isUserInBusinessUnit(fileTryingToAccess.dataValues.userId, manager.dataValues.businessUnitId);
        if (isAuthorized) {
          next();
          return;
        }
        // console.log("user is a manger but not allowed to view that data.")
      }

      // console.log(Object.getOwnPropertyNames(user.__proto__));
      let dataFilesForUser = await (user as any).getUserFiles();

      if (dataFilesForUser.some((a) => {return a.dataValues.id === idToVerify})) {
        next();
        return;
      }

      throw new UnauthorizedError("Unauthorized! You are not allowed to access that user's files");
    }

    // only allow this if it is the employees's own id or they're a manager
    if (option === AuthOption.employee) {
      let employeesForUser = await (user as any).getEmployees();

      let managerPositions = employeesForUser.filter((a) => { return a.dataValues.isManager === true && a.dataValues.currentlyEmployed === true })
      for (let manager of managerPositions) {
        // console.log('managers buID', manager.dataValues.businessUnitId);
        let isAuthorized = await isEmployeeInBusinessUnit(idToVerify, manager.dataValues.businessUnitId);
        if (isAuthorized) {
          next();
          return;
        }
      }

      // if the employee is not a manager, they can still call the route as long as they're not an admin and they're still employeed
      let requesterIsSelf = employeesForUser.some((a) => { return a.dataValues.id === idToVerify && a.dataValues.currentlyEmployed === true})
      if (requesterIsSelf) {
        // console.log("the requester was himself")

        if (req.body?.isManager) {
          // prevent privilege escalation
          req.body.isManager = undefined;
        }
        next();
        return;
      }

      throw new UnauthorizedError("Unauthorized! You are not allowed to access that user's info");
    }

    throw new AppError(500, "Developer error occurred! Please contact the developer.")
  }
}

function getToken(req: pkg.Request): string {
  let authHeader = req.get("authorization");
  if (authHeader == null) {
    throw new UnauthorizedError("Unauthorized! No Auth header!");
  }
  if (!authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Unauthorized! Please Use Bearer Token for authentication!");
  }
  let token = authHeader.slice(7);
  if (!token) {
    throw new UnauthorizedError("Unauthorized! No empty tokens allowed.");
  }
  return token;
}

async function getSession(token: string) {
  let foundSession = await Session.findOne({ where: { token: token } })
  if (!foundSession) {
    throw new AppError(401, "No sessions found for token")
  }
  return foundSession;
}

async function isEmployeeInBusinessUnit(employeeId: number, businessUnitId: number) {
  let employee = await Employee.findByPk(employeeId)
  // console.log('Business Unit Ids (emp, comparison):', employee?.dataValues.businessUnitId, businessUnitId);
  return employee?.dataValues.businessUnitId === businessUnitId;
}

async function isUserInBusinessUnit(userId: number, businessUnitId: number) {
  let employee = await Employee.findOne({ where: { userId: userId, businessUnitId: businessUnitId, currentlyEmployed: true } })
  if (!employee) {
    return false
  }
  return true;
}
