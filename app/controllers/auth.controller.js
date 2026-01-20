import db from "../models/index.js";
import authconfig from "../config/auth.config.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import jwt from "jsonwebtoken";

const User = db.user;
const Session = db.session;
const Op = db.Sequelize.Op;

let googleUser = {};

const google_id = process.env.CLIENT_ID;

const exports = {};

exports.login = async (req, res) => {


  var googleToken = req.body.credential;


  const client = new OAuth2Client(google_id);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: google_id,
    });
    googleUser = ticket.getPayload();
    console.log("Google payload is " + JSON.stringify(googleUser));
  }
  await verify().catch(console.error);

  let email = googleUser.email;
  let firstName = googleUser.given_name;
  let lastName = googleUser.family_name;

  // if we don't have their email or name, we need to make another request
  if (
    (email === undefined ||
      firstName === undefined ||
      lastName === undefined) &&
    req.body.accessToken !== undefined
  ) {
    let oauth2Client = new OAuth2Client(google_id); // create new auth client
    oauth2Client.setCredentials({ access_token: req.body.accessToken }); // use the new auth client with the access_token
    let oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });
    let { data } = await oauth2.userinfo.get(); // get user info
    console.log(data);
    email = data.email;
    firstName = data.given_name;
    lastName = data.family_name || "";
  }


  let user = {};
  let session = {};

  console.log("1",email);

  await User.findOne({
    where: { // could be this one
      email: email,
    },
  })
    .then((data) => {
      if (data != null) {
        user = data.dataValues;
      } else {
        // create a new User and save to database
        let isAdmin = false;
        let emailDomain = (email.split("@"));
        emailDomain = emailDomain[1];
        if (emailDomain == "oc.edu") {
          isAdmin = true;
        }
        user = {
          firstName: firstName,
          lastName: lastName || "",
          email: email,
          isAdmin: isAdmin,
        };
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
      return;
    });

  // this lets us get the user id
  if (user.id === undefined) {
    await User.create(user)
      .then((data) => {
        user = data.dataValues;
        //res.status(200).send({ message: "User was registered successfully!" });
        return;
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
        return;
      });
  } else {

    // doing this to ensure that the user's name is the one listed with Google
    user.firstName = firstName;
    user.lastName = lastName;

    await User.update(user, { where: { id: user.id } })
      .then((num) => {
        if (num == 1) {
          console.log("updated user's name");
        } else {
          console.log(
            `Cannot update User with id=${user.id}. Maybe User was not found or req.body is empty!`
          );
        }
      })
      .catch((err) => {
        console.log("Error updating User with id=" + user.id + " " + err);
      });
  }

  // try to find session first

  console.log("2",email);
  await Session.findOne({
    where: { // could be this one
      email: email,
      token: { [Op.ne]: "" },
    },
  })
    .then(async (data) => {
      if (data !== null) {
        session = data.dataValues;
        if (session.expirationDate < Date.now()) {
          session.token = "";
          // clear session's token if it's expired
          await Session.update(session, { where: { id: session.id } })
            .then((num) => {
              if (num == 1) {
                console.log("successfully logged out");
              } else {
                console.log("failed");
                res.status(500).send({
                  message: `Error logging out user.`,
                });
              }
            })
            .catch((err) => {
              console.log(err);
              res.status(500).send({
                message: "Error logging out user.",
              });
            });
          //reset session to be null since we need to make another one
          session = {};
        } else {
          // if the session is still valid, then send info to the front end
          let userInfo = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            id: user.id,
            ocID: user.ocID,
            isAdmin: user.isAdmin,
            token: session.token,
          };
          console.log("found a session, don't need to make another one");
          console.log(userInfo);
          res.send(userInfo);
        }
      }
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions.",
      });
    });

  if (session.id === undefined) {
    // create a new Session with an expiration date and save to database
    let token = jwt.sign({ id: email }, authconfig.secret, {
      expiresIn: 86400,
    });
    let tempExpirationDate = new Date();
    tempExpirationDate.setDate(tempExpirationDate.getDate() + 1);
    const session = {
      token: token,
      email: email,
      userID: user.id, // this is null, which is a problem.
      expirationDate: tempExpirationDate,
    };

    console.log("making a new session");
    console.log(session);

    await Session.create(session)
      .then(() => {
        let userInfo = {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          id: user.id,
          ocID: user.ocID,
          token: token,
          isAdmin: user.isAdmin,
        };
        console.log(userInfo);
        res.send(userInfo);
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
        return;
      });
  }
};

//address token security concerns if needed.
// exports.authorize = async (req, res) => {
//   console.log("authorize client");
//   const oauth2Client = new google.auth.OAuth2(
//     process.env.CLIENT_ID,
//     process.env.CLIENT_SECRET,
//     "postmessage"
//   );

//   console.log("authorize token");
//   // Get access and refresh tokens (if access_type is offline)
//   let { tokens } = await oauth2Client.getToken(req.body.code);
//   oauth2Client.setCredentials(tokens);

//   let user = {};
//   console.log("findUser");

//   await User.findOne({
//     where: {
//       id: req.params.id,
//     },
//   })
//     .then((data) => {
//       if (data != null) {
//         user = data.dataValues;
//       }
//     })
//     .catch((err) => {
//       res.status(500).send({ message: err.message });
//       return;
//     });
//   console.log("user");
//   console.log(user);
//   user.refresh_token = tokens.refresh_token;
//   let tempExpirationDate = new Date();
//   tempExpirationDate.setDate(tempExpirationDate.getDate() + 100);
//   user.expiration_date = tempExpirationDate;

//   await User.update(user, { where: { id: user.id } })
//     .then((num) => {
//       if (num == 1) {
//         console.log("updated user's google token stuff");
//       } else {
//         console.log(
//           `Cannot update User with id=${user.id}. Maybe User was not found or req.body is empty!`
//         );
//       }
//       let userInfo = {
//         refresh_token: user.refresh_token,
//         expiration_date: user.expiration_date,
//       };
//       console.log(userInfo);
//       res.send(userInfo);
//     })
//     .catch((err) => {
//       res.status(500).send({ message: err.message });
//     });

//   console.log(tokens);
//   console.log(oauth2Client);
// };

exports.logout = async (req, res) => {
  console.log(req.body);
  if (req.body === null) {
    res.send({
      message: "User has already been successfully logged out!",
    });
    return;
  }

  // invalidate session -- delete token out of session table
  let session = {};

  await Session.findAll({ where: { token: req.body.token } })
    .then((data) => {
      if (data[0] !== undefined) session = data[0].dataValues;
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving sessions.",
      });
      return;
    });

  session.token = "";

  // session won't be null but the id will if no session was found
  if (session.id !== undefined) {
    Session.update(session, { where: { id: session.id } })
      .then((num) => {
        if (num == 1) {
          console.log("successfully logged out");
          res.send({
            message: "User has been successfully logged out!",
          });
        } else {
          console.log("failed");
          res.status(500).send({
            message: `Error logging out user.`,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).send({
          message: "Error logging out user.",
        });
      });
  } else {
    console.log("already logged out");
    res.send({
      message: "User has already been successfully logged out!",
    });
  }
};

exports.getSessionValidity = async (req, res) => {
  Session.findAll({ where: { token: req.body.token } })
    .then((data) => {
      let session = data[0];
      console.log(session.expirationDate);
      if (session != null) {
        if (session.expirationDate >= Date.now()) {
          return res.status(200).send({ message: "token not expired" });
        } else
          return res.status(401).send({
            message: "Unauthorized! Expired Token, Logout and Login again",
          });
      }
    })
    .catch((err) => {
      return res.status(500).send({
        message: err.message || "an unknown error occurred while authenticating",
      });
    });
}
export default exports;
