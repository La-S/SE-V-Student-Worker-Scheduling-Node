import db from "../models/index.ts";
import pkg from 'express';
import type { SessionType } from "../types/session.type.ts";
import { UnauthorizedError } from "../error/unauthorized.error.ts";
import { AppError } from "../error/app.error.ts";
import { Op } from "sequelize";
import Employee from "../models/employee.model.ts";
import UserFile from "../models/userfile.model.ts";


const Session = db.Session;

const auth: any = {};
auth.authenticate = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = getToken(req);
  let foundSession = await getSession(token);
  let sessionData = foundSession.dataValues as SessionType;

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
auth.isAdminOnly = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
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
auth.managerOrAdminOnly = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = getToken(req);
  let foundSession = await getSession(token);
  let user = await (foundSession as any).getUser();
  if (user.dataValues.isAdmin === true) {
    next();
    return;
  }
  let employeesForUser = await (user as any).getEmployees() as any[];
  let isManagerAnywhere = employeesForUser.some((a) => { return a.dataValues.isManager === true })
  if (isManagerAnywhere === true) {
    next();
    return;
  }

  throw new UnauthorizedError("Unauthorized! User must be admin to perform this function")
};


//AUTHORIZATION METHOD, DOES NOT REPLACE AUTHENTICATE

const AuthOption = {
  employee: "employee",
  businessUnit: "businessUnit",
  userfile: "userfile"
}

auth.authorizeById = (option: any) => {
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

    if (option === AuthOption.userfile) {
      let fileTryingToAccess = await UserFile.findOne({ where: { id: idToVerify } })
      let employeesForUser = await (user as any).getEmployees();
      let managerPositions = employeesForUser.filter((a) => { return a.dataValues.isManager === true })
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

      let managerPositions = employeesForUser.filter((a) => { return a.dataValues.isManager === true })
      for (let manager of managerPositions) {
        // console.log('managers buID', manager.dataValues.businessUnitId);
        let isAuthorized = await isEmployeeInBusinessUnit(idToVerify, manager.dataValues.businessUnitId);
        if (isAuthorized) {
          next();
          return;
        }
      }

      // if the employee is not a manager, they can still call the route as long as they're not an admin.
      let requesterIsSelf = employeesForUser.some((a) => { return a.dataValues.id === idToVerify })
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
  let employee = await Employee.findOne({ where: { id: employeeId } })
  // console.log('Business Unit Ids (emp, comparison):', employee?.dataValues.businessUnitId, businessUnitId);
  return employee?.dataValues.businessUnitId === businessUnitId;
}

async function isUserInBusinessUnit(userId: number, businessUnitId: number) {
  let employees = await Employee.findAll({ where: { userId: userId } })
  for (let employee of employees) {
    // console.log('Business Unit Ids (emp, comparison):', employee?.dataValues.businessUnitId, businessUnitId);
    if (employee?.dataValues.businessUnitId === businessUnitId) {
      return true;
    }
  }

  return false;
}

export default auth;