import db from "../models/index.ts";
import pkg from 'express';
import type { SessionType } from "../types/session.type.ts";
import { UnauthorizedError } from "../error/unauthorized.error.ts";
import { AppError } from "../error/app.error.ts";

const Session = db.Session;

const auth: any = {};
auth.authenticate = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = getToken(req);
  const sessions = await Session.findAll({ where: { token: token } })
  if (sessions.length == 0) {
    //maybe have new error class that holds token and we can keep info server-side 
    throw new AppError(500, "No sessions found for user")
  }
  let session = sessions[0].dataValues as SessionType;
  console.log(session.expirationDate);
  if (session == null || session.expirationDate.getTime() < Date.now()) {
    throw new UnauthorizedError("Unauthorized! Expired Token, Logout and Login again");
  }
  next();
  return;
};

//AUTHORIZATION METHOD, DOES NOT REPLACE AUTHENTICATE
auth.isAdminOnly = async (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = getToken(req);
  const data = await Session.findAll({ where: { token: token } });
  let session = data[0];
  if (!session) {
    throw new AppError(404, "No sessions found for token");
  }
  let user = await (session as any).getUser();
  if (user.dataValues.isAdmin !== true) {
    throw new UnauthorizedError("Unauthorized! User must be admin to perform this function")
  }
  next();
  return;
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
    const data = await Session.findAll({ where: { token: token } });
    let session = data[0];
    if (!session) {
      throw new AppError(404, "No sessions found for token");
    }
    let user = await (session as any).getUser();
    if (user.dataValues.isAdmin === true) {
      next();
      return;
    }

    if (option === AuthOption.employee) {
      let employeesForUser = await (user as any).getEmployees();
      let isManagerAnywhere = !!employeesForUser.some((a) => { return a.dataValues.isManager === true }) // console.log(a.dataValues); 
      let isRelatedToId = employeesForUser.some((a) => { console.log('dv', a.dataValues); return a.dataValues.id === idToVerify })

      if (isManagerAnywhere || employeesForUser.some((a) => {return a.dataValues.id === idToVerify })) {
        next();
        return;
      }

      throw new UnauthorizedError("Unauthorized! You are not allowed to access that user's info");
    }

    next();
    return;
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
  return authHeader.slice(7);
}

export default auth;