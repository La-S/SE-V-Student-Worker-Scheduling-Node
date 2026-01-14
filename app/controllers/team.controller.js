import db from "../models/index.js";
const User = db.user;
const Team = db.team;
const Workout = db.workout;
const Op = db.Sequelize.Op;
const exports = {};

// Create and Save a new Team
exports.create = (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content must have a name!",
    });
    return;
  }

  // Create a Team
  const team = {
    name: req.body.name,
  };
  // Save Team in the database
  Team.create(team)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the team.",
      });
    });
};

// Retrieve all Teams from the database.
exports.findAll = (req, res) => {
  const id = req.query.id;
  var condition = id
    ? {
      id: {
        [Op.like]: `%${id}%`,
      },
    }
    : null;

  Team.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving teams.",
      });
    });
};

// Find a single Team with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Team.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find team with id ${id}. Team may not exist.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: `Error retrieving team with id ${id}`,
      });
    });
};

// Update a Team by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content must have a name!",
    });
    return;
  }

  const updatedData = {
    name: req.body.name,
  };
  Team.update(updatedData, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Team was updated successfully.",
        });
      } else {
        res.status(404).send({
          message: `Cannot update team with id ${id}. Team may not exist.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: `Error updating team with id ${id}`,
      });
    });
};

// Delete a Team with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  Team.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "Team was deleted successfully!",
        });
      } else {
        res.status(404).send({
          message: `Cannot delete team with id ${id}. Team may not exist.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: `Unknown error deleting team with id ${id}`,
      });
    });
};

exports.addUsers = async (req, res) => {
  const id = req.params.id;
  const team = await Team.findByPk(id);
  if (!team) {
    res.status(404).send({ message: "team not found!" });
    return;
  }
  const users = req.body;
  team.addUsers(users)
    .then(() =>
      res.status(200).send({
        message: "Users added"
      }))
    .catch((err) => {
      if (err.name === "SequelizeUniqueConstraintError") {
        res.status(409).send({ message: "one or more users is already on this team. They cannot be added again." })
        return;
      }
      res.status(500).send({
        message: `Unknown error adding members to team`,
      });
    });
}

exports.removeUsers = async (req, res) => {
  const id = req.params.id;
  const team = await Team.findByPk(id);
  if (!team) {
    res.status(404).send({ message: "team not found!" });
    return;
  }
  const users = req.body;
  team.removeUsers(users)
    .then(() =>
      res.status(200).send({
        message: "Users removed"
      }))
    .catch((err) => {
      res.status(500).send({
        message: `Unknown error removing members from the team`,
      });
    });
};

exports.getUsers = async (req, res) => {
  const id = req.params.id;
  const team = await Team.findByPk(id);
  if (!team) {
    res.status(404).send({ message: "team not found!" });
    return;
  }
  team.getUsers()
    .then((data) =>
      res.status(200).send(data))
    .catch((err) => {
      res.status(500).send({
        message: `Unknown error getting users for a team`,
      });
    });
};

export default exports;
