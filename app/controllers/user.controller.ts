import db from "../models/index.js";
const User = db.user;
import { Model, Op } from 'sequelize';
import pkg from 'express';
import { UserType } from "../types/user.type.js";

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
  User.create(user as any)
    .then((data: any) => {
      res.send(data);
    })
    .catch((err: any) => {
      if (err.name === 'SequelizeValidationError' || err.name === "SequelizeForeignKeyConstraintError") {
        res.status(400).send({
          message: err.message
        })
        return;
      }
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    });
};

// Retrieve all People from the database.
exports.findAll = (req: pkg.Request, res: pkg.Response) => {
  const id = req.query.id!;
  var condition = id ? { id: { [Op.like]: `%${id}%` } } : undefined;

  User.findAll({ where: condition })
    .then((data: any) => {
      res.send(data);
    })
    .catch((err: any) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving people.",
      });
    });
};

// Find a single User with an id
exports.findOne = (req: pkg.Request, res: pkg.Response) => {
  const id = req.params.id;

  User.findByPk(id)
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
    let userForEmail = await getUserForEmail(req.body.email)
    if (userForEmail && (JSON.stringify(userForEmail) !== JSON.stringify(await getUserForId(id)))) {
      res.status(409).send({ message: `user with email ${req.body.email} already exists. Use a different email.` });
      return;
    }
    if (req.body.role) {
      res.status(400).send({ message: "user role cannot be changed from this endpoint, please use PUT user/:id/role" })
      return;
    }
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
  let userForId = await getUserForId(id)
  if (!userForId) {
    res.status(404).send({ message: `user for id ${id} not found.` });
    return;
  }

  User.destroy({
    where: { id: id },
  })
    .then((num: number) => {
      if (num == 1) {
        res.send({
          message: "User was deleted successfully!",
        });
      } else {
        res.send({
          message: `Cannot delete User with id=${id}. Maybe User was not found!`,
        });
      }
    })
    .catch((err: string) => {
      res.status(500).send({
        message: "Could not delete User with id=" + id,
      });
    });
};

exports.updateRole = async (req: pkg.Request, res: pkg.Response) => {
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


function getUserForEmail(email: string) {
  return User.findOne({
    where: { // could be this one
      email: email,
    },
  });
}
async function getUserForId(id: number) {
  return User.findByPk(id);
}

export default exports;
