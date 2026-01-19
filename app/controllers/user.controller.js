import db from "../models/index.js";
const User = db.user;
const Op = db.Sequelize.Op;
const exports = {};
const missingAttr = "Missing attribute: "
// Create and Save a new User
exports.create = async (req, res) => {
  if (req.body.email && await getUserForEmail(req.body.email)) {
    res.status(409).send({ message: `user with email ${req.body.email} already exists. Use a different email.` });
    return;
  }

  // Create a User
  const user = {
    id: req.body.id,
    first_name: req.body.firstName,
    last_name: req.body.lastName,
    email: req.body.email,
    role: req.body.role ?? "user",
    // refresh_token: req.body.refresh_token,
    // expiration_date: req.body.expiration_date
  };

  // Save User in the database
  User.create(user)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
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
exports.findAll = (req, res) => {
  const id = req.query.id;
  var condition = id ? { id: { [Op.like]: `%${id}%` } } : null;

  User.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving people.",
      });
    });
};

// Find a single User with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find User with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving User with id=" + id,
      });
    });
};

// Find a single User with an email
exports.findByEmail = (req, res) => {
  const email = req.params.email;

  User.findOne({
    where: {
      email: email,
    },
  })
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.send({ email: "not found" });
        /*res.status(404).send({
          message: `Cannot find User with email=${email}.`
        });*/
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving User with email=" + email,
      });
    });
};

// Update a User by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
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
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "User was updated successfully.",
        });
      } else {
        res.status(404).send({
          message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
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
exports.delete = async (req, res) => {
  const id = req.params.id;
  let userForId = await getUserForId(id)
  if (!userForId) {
    res.status(404).send({ message: `user for id ${id} not found.` });
    return;
  }

  User.destroy({
    where: { id: id },
  })
    .then((num) => {
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
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete User with id=" + id,
      });
    });
};

exports.getTeams = async (req, res) => {
  const id = req.params.id;
  const user = await User.findByPk(id);
  if (!user) {
    res.status(404).send({ message: "user not found!" });
    return;
  }
  user.getTeams()
    .then((data) =>
      res.status(200).send(data))
    .catch((err) => {
      res.status(500).send({
        message: `Unknown error getting teams`,
      });
    });
}

exports.updateRole = async (req, res) => {
  const id = req.params.id;
  User.update(req.body, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "User role was updated successfully.",
        });
      } else {
        res.status(404).send({
          message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`,
        });
      }
    })
    .catch((err) => {
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


function getUserForEmail(email) {
  return User.findOne({
    where: {
      email: email,
    },
  });
}
async function getUserForId(id) {
  return User.findByPk(id);
}

export default exports;
