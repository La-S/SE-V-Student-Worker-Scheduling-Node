import pkg from 'express';
import type { SessionType } from "../types/session.type.ts";
import { AppError } from "../error/app.error.ts";
import Session from "../models/session.model.ts";
import users from "../controllers/user.controller.ts";

const exports: any = {}


exports.debugCreateSession = async (req: pkg.Request, res: pkg.Response) => {
  // This function breaks the coding patterns of other functions since it's for debugging.
  // If you want to use this as an example, please don't!
  if (!req.body || !req.body.newToken || !req.body.email || !req.body.userId || !req.body.password){
    throw new AppError(400,  "Must have a request body with an email, userId, password, and newToken, firstName, lastName, and isAdmin.");
  }

  if (!process.env.SECRET_PASSWORD || req.body.password !== process.env.SECRET_PASSWORD) {
     throw new AppError(400,  "Sorry, wrong token bub.");
  }

  let tempExpirationDate = new Date();
  tempExpirationDate.setDate(tempExpirationDate.getDate() + 150); // expires once every 5 months
  const session: SessionType = {
    token: req.body.newToken,
    email: req.body.email,
    userId: req.body.userId,
    expirationDate: tempExpirationDate,
  };

  console.log("making a new session for DEBUG USER");
  console.log(session);
  await Session.create(session as any);

  res.status(200).send({ token: session.token });
};

exports.debugCreateUser = async (req: pkg.Request, res: pkg.Response) => {
  return users.create(req, res);
};

exports.debugFindUserByEmail = async (req: pkg.Request, res: pkg.Response) => {
  return users.findByEmail(req, res);
};

exports.debugDeleteEmail = async (req: pkg.Request, res: pkg.Response) => {
  return users.findByEmail(req, res);
};

export default exports;