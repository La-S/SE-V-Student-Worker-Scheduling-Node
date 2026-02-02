import db from "../models/index.ts";
import pkg from 'express';
import type { SessionType } from "../types/session.type.ts";

const Session = db.Session;

const auth: any = {};
auth.authenticate = (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = null;

  let authHeader = req.get("authorization");
  if (authHeader != null) {
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);

      Session.findAll({ where: { token: token } })
        .then((data) => {
          let session = data[0].dataValues as SessionType;
          console.log(session.expirationDate);
          if (session != null) {
            if (session.expirationDate.getTime() >= Date.now()) {
              next();
              return;
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
  } else {
    return res.status(401).send({
      message: "Unauthorized! No Auth Header",
    });
  }
};

// //AUTHORIZATION METHOD, DOES NOT REPLACE AUTHENTICATE
// auth.isCoachAdmin = (req, res, next) => {
//   let token = null;

//   let authHeader = req.get("authorization");
//   if (authHeader == null) {
//     return res.status(401).send("Unauthorized, no auth header");
//   }
//   if (authHeader.startsWith("Bearer ")) {
//     token = authHeader.slice(7);

//     Session.findAll({ where: { token: token } })
//       .then(async (data) => {
//         let session = data[0];
//         if (session != null) {
//           let user = await session.getUser();
//           if (user) {
//             next();
//             return;
//           }
//           else
//             return res.status(401).send({
//               message: "Unauthorized! User must be admin or coach to perform this function"
//             });
//         }
//         return res.status(401).send({
//           message: "Unauthorized! No Session!"
//         });
//       })
//       .catch((err) => {
//         return res.status(500).send({
//           message: err.message || "an unknown error occurred while authenticating",
//         });
//       });
//   }
// };

//AUTHORIZATION METHOD, DOES NOT REPLACE AUTHENTICATE
auth.isAdminOnly = (req: pkg.Request, res: pkg.Response, next: pkg.NextFunction) => {
  let token = null;

  let authHeader = req.get("authorization");
  if (authHeader == null) {
    return res.status(401).send("Unauthorized, no auth header");
  }
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7);

    Session.findAll({ where: { token: token } })
      .then(async (data) => {
        let session = data[0];
        if (session != null) {
          let user = await (session as any).getUser();
          if (user.isAdmin === true) {
            next();
            return;
          }
          else
            return res.status(401).send({
              message: "Unauthorized! User must be admin to perform this function"
            });
        }
        return res.status(401).send({
          message: "Unauthorized! No Session!"
        });
      })
      .catch((err) => {
        return res.status(500).send({
          message: err.message || "an unknown error occurred while authenticating",
        });
      });
  }
};



export default auth;