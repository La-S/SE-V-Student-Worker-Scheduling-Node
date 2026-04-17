import db from "../models/index.ts";
import pkg from 'express';
import type { SessionType } from "../types/session.type.ts";
import { UnauthorizedError } from "../error/unauthorized.error.ts";
import { AppError } from "../error/app.error.ts";

const Session = db.Session;

const auth: any = {};
auth.authenticate = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = getToken(req);
  let foundSession = await Session.findOne({ where: { token: token } })
  if (!foundSession) {
    //maybe have new error class that holds token and we can keep info server-side 
    throw new AppError(401, "No sessions found for token")
  }
  let sessionData = foundSession.dataValues as SessionType;
  if (sessionData == null || sessionData.expirationDate.getTime() < Date.now()) {
    throw new UnauthorizedError("Unauthorized! Expired Token, Logout and Login again");
  }
  next();
  return;
};

//AUTHORIZATION METHOD, DOES NOT REPLACE AUTHENTICATE
auth.isAdminOnly = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = getToken(req);
  const foundSession = await Session.findOne({ where: { token: token } });
  if (!foundSession) {
    throw new AppError(401, "No sessions found for token");
  }
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
  const foundSession = await Session.findOne({ where: { token: token } });
  if (!foundSession) {
    throw new AppError(401, "No sessions found for token");
  }
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
}

auth.authorizeById = (option: any) => {
  return async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
    let idToVerify = parseInt(req.params.id, 10);
    console.log("Verifying: ", idToVerify)
    if (!idToVerify) {
      throw new UnauthorizedError("Unauthorized! User must have an ID to perform this function")
    }

    let token = getToken(req);
    const foundSession = await Session.findOne({ where: { token: token } });
    if (!foundSession) {
      throw new AppError(401, "No sessions found for token");
    }
    let user = await (foundSession as any).getUser();
    if (user.dataValues.isAdmin === true) {
      next();
      return;
    }

    // only allow this if it is the employees's own id or they're a manager
    // note, managers can currently view *any* user's info.
    if (option === AuthOption.employee) {
      let employeesForUser = await (user as any).getEmployees();
      let isManagerAnywhere = employeesForUser.some((a) => { return a.dataValues.isManager === true })
      let isRelatedToId = employeesForUser.some((a) => { return a.dataValues.id === idToVerify })

      if (isManagerAnywhere || isRelatedToId) {
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

export default auth;