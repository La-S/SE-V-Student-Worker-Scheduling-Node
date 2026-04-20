import db from "../models/index.ts";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { Op } from 'sequelize';
import pkg from 'express';
import type { UserType } from "../types/user.type.ts";
import type { SessionType } from "../types/session.type.ts";
import { AppError } from "../error/app.error.ts";
import { UnauthorizedError } from "../error/unauthorized.error.ts";

const User = db.User;
const Session = db.Session;

let googleUser: TokenPayload | undefined;

const google_id = process.env.CLIENT_ID;

const exports: any = {};

interface GoogleUserInfo {
  email?: string,
  firstName?: string,
  lastName?: string
}

exports.login = async (req: pkg.Request, res: pkg.Response) => {
  var googleToken = req.body.credential;
  var googleAccessToken = req.body.accessToken;

  let googleUserInfo = await getGoogleUserInfo(googleToken, googleAccessToken);

  let user: UserType;
  let session = {};
  let data = await User.findOne({
    where: { // could be this one
      email: googleUserInfo.email,
    },
  })
  if (data != null) {
    user = data.dataValues;
  } else {
    // create a new User and save to database
    let isAdmin = false;
    let emailParts = (googleUserInfo.email.split("@"));
    let emailDomain = emailParts[1];
    if (emailDomain == "oc.edu") {
      // could do special stuff if they're a faculty/staff
    }
    user = {
      firstName: googleUserInfo.firstName,
      lastName: googleUserInfo.lastName || "",
      email: googleUserInfo.email,
      isAdmin: isAdmin,
    };
  }

  // if the user is old, and they updated their Google Acct Name,
  // we should update them in the DB.
  user.firstName = googleUserInfo.firstName;
  user.lastName = googleUserInfo.lastName;
  user = await upsertUser(user);

  // try to find an existing session
  let sessionToken = await getExistingSessionToken(googleUserInfo.email)

  if (!sessionToken) {
    // create a new Session with an expiration date and save to database
    let token = jwt.sign({ id: googleUserInfo.email }, process.env.JWT_SECRET, {
      expiresIn: 3600 * 24 * 31, // expires once every 31 days.
    });
    let tempExpirationDate = new Date();
    tempExpirationDate.setDate(tempExpirationDate.getDate() + 31);
    const session: SessionType = {
      token: token,
      email: googleUserInfo.email,
      userId: user.id!,
      expirationDate: tempExpirationDate,
    };

    console.log("making a new session");
    await createSession(session)

    sessionToken = session.token;
  }
  let userInfo = { ...user, token: sessionToken }

  res.send(userInfo);
};

exports.logout = async (req: pkg.Request, res: pkg.Response) => {
  // if (req.body === null) {
  //   res.status(200).send({ message: "User has already been successfully logged out!" });
  //   return;
  // }
  if (!req.body || !req.body.token){
    throw new AppError(400,  "Must have a request body with a token");
  }

  await clearSessionByToken(req.body.token);
  console.log("successfully logged out");
  res.status(200).send({ message: "User has been successfully logged out!" });
};

exports.getSessionValidity = async (req: pkg.Request, res: pkg.Response) => {
  let response = await Session.findOne({ where: { token: req.body.token } })
  let session = response?.dataValues as SessionType | undefined;
  if (!session || session.expirationDate.getTime() < Date.now()) {
    throw new UnauthorizedError("Unauthorized! Expired Token, Logout and Login again")
  }
  return res.status(200).send({ message: "token not expired" });
}

async function createSession(session: SessionType) {
  await Session.create(session as any);
}

async function getExistingSessionToken(email: string) {
  let sessionObj = await Session.findOne({
    where: { // could be this one
      email: email,
      token: { [Op.ne]: null },
    },
  });

  if (sessionObj) {
    let session = sessionObj.dataValues as SessionType;
    if (session.expirationDate.getTime() < Date.now()) {
      // clear session's token if it's expired
      clearSessionByToken(session.token!);
      return;
    } else {
      // if the session is still valid, then send info to the front end
      return session.token;
    }
  }
  return false;
}

// invalidate session -- set the token to "" & update the expiration date to now.
// That way, if a bad guy tries to user "" as a token, he can't.
async function clearSessionByToken(token: string) {
  let response = await Session.update({token: null, expirationDate: new Date()}, { where: { token: token } });
  if (response[0] == 1) {
    console.log("successfully logged out");
  } else {
    console.log("failed logging a user out");
    throw Error(`Error logging out user.`);
  }
}

async function upsertUser(user: UserType): Promise<UserType> {
  if (!user.id) {
    let createdRow = await User.create(user as any);
    return createdRow.dataValues;
  }

  let response = await User.update(user, { where: { id: user.id } });
  if (response[0] <= 0) {
    throw new AppError(400, `Cannot update User with id ${user.id}. Check request body`);
  }
  console.log("updated user's name");
  return user;

}

async function getGoogleUserInfo(googleToken: string, googleAccessToken: string) {
  googleUser = await getGoogleUser(googleToken);
  let email = googleUser?.email;
  let firstName = googleUser?.given_name;
  let lastName = googleUser?.family_name || "";

  // if we don't have their email or name, we need to make another request
  if (!email || !firstName) {
    if (!googleAccessToken) {
      throw new AppError(500, "We couldn't get the access token to retrieve user info from Google.")
    }
    let oauth2Client = new OAuth2Client(google_id); // create new auth client
    oauth2Client.setCredentials({ access_token: googleAccessToken }); // use the new auth client with the access_token
    let oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    let { data } = await oauth2.userinfo.get(); // get user info
    if (data && data.email && data.given_name) {
      email = data.email;
      firstName = data.given_name;
      lastName = data.family_name || "";
    } else {
      throw new AppError(500, "We couldn't get the user's information from Google.")
    }
  }
  return { email, firstName, lastName };
}

async function getGoogleUser(googleToken: string) {
  const client = new OAuth2Client(google_id);
  const ticket = await client.verifyIdToken({
    idToken: googleToken,
    audience: google_id,
  });
  let googleUser = ticket.getPayload();
  // console.log("Google payload is " + JSON.stringify(googleUser));
  return googleUser;
}




export default exports;
