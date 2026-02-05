import db from "../models/index.ts";
const User = db.User;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import type { UserType } from "../types/user.type.ts";
import { getMessaging } from "firebase-admin/messaging";

const exports: any = {};

// Create and Save a new User
exports.create = async (req: pkg.Request, res: pkg.Response) => {
  if (req.body.email && await getUserForEmail(req.body.email)) {
    res.status(409).send({ message: `user with email ${req.body.email} already exists. Use a different email.` });
    return;
  }

  // Create a User
  const user: UserType = {
    id: req.body.id,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    isAdmin: req.body.isAdmin,
  };

  // Save User in the database
  try {
    const data = await User.create(user as any);
    res.send(data);
  }
  catch (err: any) {
    if (err.name === 'SequelizeValidationError' || err.name === "SequelizeForeignKeyConstraintError") {
      res.status(400).send({
        message: err.message
      })
      return;
    }
    res.status(500).send({
      message: err.message || "Some error occurred while creating the user.",
    });
  };
};

// Retrieve all People from the database.
exports.findAll = async (req: pkg.Request, res: pkg.Response) => {
  const id = req.query.id!;
  var condition = id ? { id: { [Op.like]: `%${id}%` } } : undefined;

  try {
    const data = await User.findAll({ where: condition });
    res.send(data);
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving users.",
    });
  };
};

// Find a single User with an id
exports.findOne = (req: pkg.Request, res: pkg.Response) => {
  const id = req.params.id;

  try
  const data = await User.findByPk(id)
  if 
    .then((data: any) => {
    if (data) {
      res.send(data);
    } else {
      res.status(404).send({
        message: `Cannot find User with id=${id}.`,
      });
    }
  })
      .catch((err: any) => {
        res.status(500).send({
          message: "Error retrieving User with id=" + id,
        });
      });
};

// Find a single User with an email
exports.findByEmail = (req: pkg.Request, res: pkg.Response) => {
  const email = req.params.email;

  User.findOne({
    where: { // could be this one
      email: email,
    },
  })
    .then((data: any) => {
      if (data) {
        res.send(data);
      } else {
        res.send({ email: "not found" });
        /*res.status(404).send({
          message: `Cannot find User with email=${email}.`
        });*/
      }
    })
    .catch((err: any) => {
      res.status(500).send({
        message: "Error retrieving User with email=" + email,
      });
    });
};

// Update a User by the id in the request
exports.update = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  if (req.body.email) {
    let userForEmail = await getUserForEmail(req.body.email, res)
    if (res.headersSent) {
      return;
    }
    if (userForEmail && (JSON.stringify(userForEmail) !== JSON.stringify(await getUserForId(id, res)))) {
      if (res.headersSent) {
        return;
      }
      res.status(409).send({ message: `user with email ${req.body.email} already exists. Use a different email.` });
      return;
    }
    if (req.body.role) {
      res.status(400).send({ message: "user role cannot be changed from this endpoint, please use PUT user/:id/role" })
      return;
    }
  }

  if (req.body.pushToken) {
    console.log("subscribing to topic all-users!");
    await getMessaging().subscribeToTopic(req.body.pushToken, 'all-users');
  }

  User.update(req.body, {
    where: { id: id },
  })
    .then((num: [number]) => {
      if (num[0] == 1) {
        res.send({
          message: "User was updated successfully.",
        });
      } else {
        res.status(404).send({
          message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`,
        });
      }
    })
    .catch((err: any) => {
      if (err.name === 'SequelizeValidationError' || err.name === "SequelizeForeignKeyConstraintError") {
        res.status(400).send({
          message: err.message
        });
        return;
      }
      res.status(500).send({
        message: "Error updating User with id=" + id,
      });
    });
};

// Delete a User with the specified id in the request
exports.delete = async (req: pkg.Request, res: pkg.Response) => {
  const id = parseInt(req.params.id, 10);
  try {
    let userForId = await getUserForId(id, res)
    if (res.headersSent) {
      return;
    }
    const numDeleted = await User.destroy({
      where: { id: id },
    })
    if (numDeleted <= 0) {
      res.status(400).send({ message: `Delete for id ${id} did not delete. Check request body.` })
      return;
    }
    res.status(200).send({ message: "User deleted successfully!" });
  }
  catch (err: string) {
    res.status(500).send({
      message: err.message || "Some error occurred.",
    });
  };
};

exports.updateIsAdmin = async (req: pkg.Request, res: pkg.Response) => {
  const id = req.params.id;
  User.update(req.body, {
    where: { id: id },
  })
    .then((num: [number]) => {
      if (num[0] == 1) {
        res.send({
          message: "User role was updated successfully.",
        });
      } else {
        res.status(404).send({
          message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`,
        });
      }
    })
    .catch((err: any) => {
      if (err.name === 'SequelizeValidationError' || err.name === "SequelizeForeignKeyConstraintError") {
        res.status(400).send({
          message: err.message
        });
        return;
      }
      res.status(500).send({
        message: "Error updating User Role with id=" + id,
      });
    });
}


async function getUserForEmail(email: string, res: pkg.Response) {
  try {
    const data = await User.findOne({ where: { email: email } });
    if (!data) {
      res.status(404).send({
        message: `User for email ${email} not found`
      })
    }
    return data;
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred.",
    });
  }
};

async function getUserForId(id: number, res: pkg.Response): Promise<Model<any, any> | null> {
  try {
    const data = await User.findByPk(id);
    if (!data) {
      res.status(404).send({
        message: `User for id ${id} not found`
      })
    }
    return data;
  }
  catch (err: any) {
    res.status(500).send({
      message: err.message || "Some error occurred.",
    });
  }
  return null;
}

export default exports;
