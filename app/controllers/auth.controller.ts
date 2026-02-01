import db from "../models/index.js";
import authconfig from "../config/auth.config.js";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { Op } from 'sequelize';
import pkg from 'express';
import { UserType } from "../types/user.type.js";
import { SessionType } from "../types/session.type.js";

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
  try {
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
        isAdmin = true;
      }
      user = {
        firstName: googleUserInfo.firstName,
        lastName: googleUserInfo.lastName || "",
        email: googleUserInfo.email,
        isAdmin: isAdmin,
      };
    }
  } catch (err: any) {
    res.status(500).send({ message: err.message });
    return;
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
    let token = jwt.sign({ id: googleUserInfo.email }, authconfig.secret, {
      expiresIn: 86400,
    });
    let tempExpirationDate = new Date();
    tempExpirationDate.setDate(tempExpirationDate.getDate() + 1);
    const session: SessionType = {
      token: token,
      email: googleUserInfo.email,
      userID: user.id!,
      expirationDate: tempExpirationDate,
    };

    console.log("making a new session");
    console.log(session);
    await createSession(session)

    sessionToken = session.token;
  }
  let userInfo = {...user, token: sessionToken}

  console.log(userInfo);
  res.send(userInfo);
};

exports.logout = async (req: pkg.Request, res: pkg.Response) => {
  console.log('logout this guy --->>', req.body);
  if (req.body === null) {
    res.send({ message: "User has already been successfully logged out!" });
    return;
  }

  // invalidate session -- delete token out of session table
  try {
    let response = await Session.update({token: ""}, { where: { token: req.body.token } })
    if (response[0] >= 0) {
      console.log("successfully logged out");
      res.send({message: "User has been successfully logged out!"});
    } else {
      throw Error('Unknown error logging out user.')
    }
  } catch(err: any) {
    console.error(err);
    res.status(500).send({message: "Error logging out user."});
  }
};

exports.getSessionValidity = async (req: pkg.Request, res: pkg.Response) => {
  try {
    let response = await Session.findOne({ where: { token: req.body.token } })
    let session = response?.dataValues as SessionType | undefined;
    console.log(session?.expirationDate);
    if (session && session.expirationDate.getTime() >= Date.now()) {
        return res.status(200).send({ message: "token not expired" });
    } else {
      return res.status(401).send({message: "Unauthorized! Expired Token, Logout and Login again"});
    }
  } catch(err: any) {
      return res.status(500).send({
        message: err.message || "an unknown error occurred while authenticating",
      });
  }
}

async function createSession(session: SessionType) {
  await Session.create(session as any);
}

async function getExistingSessionToken(email: string) {
  let sessionObj = await Session.findOne({
    where: { // could be this one
      email: email,
      token: { [Op.ne]: "" },
    },
  });

  if (sessionObj) {
    let session = sessionObj.dataValues as SessionType;
    if (session.expirationDate.getTime() < Date.now()) {
      // clear session's token if it's expired
      clearSession(session);
      return;
    } else {
      // if the session is still valid, then send info to the front end
      return session.token;
    }
  }
  return false;
}

async function clearSession(session: SessionType) {
  session.token = ""
  let response = await Session.update(session, { where: { id: session.id } });
  if (response[0] == 1) {
    console.log("successfully logged out");
  } else {
    console.log("failed");
    throw Error(`Error logging out user.`);
  }
}

async function upsertUser(user: UserType): Promise<UserType> {
  if (!user.id) {
    let createdRow = await User.create(user as any);
    return createdRow.dataValues;
  } else {
    let response = await User.update(user, { where: { id: user.id } });
    if (response[0] == 1){
      console.log("updated user's name");
      return user;
    } else {
      throw Error(`Cannot update User with id=${user.id}. Maybe User was not found or req.body is empty!`);
    }
  }
}

async function getGoogleUserInfo(googleToken: string, googleAccessToken: string) {
  googleUser = await getGoogleUser(googleToken);
  let email = googleUser?.email;
  let firstName = googleUser?.given_name;
  let lastName = googleUser?.family_name;

  // if we don't have their email or name, we need to make another request
  if (!email || !firstName || !lastName) {
    if (!googleAccessToken) {
      throw Error("We couldn't get the access token to retrieve user info from Google.")
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
      throw Error("We couldn't get the user's information from Google.")
    }
  }
  return {email, firstName, lastName};
}

async function getGoogleUser(googleToken: string) {
  const client = new OAuth2Client(google_id);
  const ticket = await client.verifyIdToken({
    idToken: googleToken,
    audience: google_id,
  });
  let googleUser = ticket.getPayload();
  console.log("Google payload is " + JSON.stringify(googleUser));
  return googleUser;
}




export default exports;
