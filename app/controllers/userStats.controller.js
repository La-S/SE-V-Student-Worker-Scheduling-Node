import db from "../models/index.js";
const UserStats = db.userStats;
const Op = db.Sequelize.Op;

const exports = {};

// Create and Save a new UserStat record
exports.create = (req, res) => {
  if (!req.body.userId) {
    res.status(400).send({
      message: "Content must include a userId!",
    });
    return;
  }

  const stat = {
    userId: req.body.user_Id,
    timestamp: req.body.timestamp,
    weight: req.body.weight,
    height: req.body.height,
  };

  UserStats.create(stat)
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating user stats.",
      })
    );
};

// Retrieve all UserStats
exports.findAll = (req, res) => {
  const userId = req.query.userId;

  const condition = userId
    ? { userId: { [Op.eq]: userId } }
    : null;

  UserStats.findAll({ where: condition })
    .then((data) => res.send(data))
    .catch((err) =>
      res.status(500).send({
        message: err.message || "Some error occurred retrieving user stats.",
      })
    );
};

// Retrieve one UserStat by id
exports.findOne = (req, res) => {
  const id = req.params.id;

  UserStats.findByPk(id)
    .then((data) => {
      if (data) res.send(data);
      else {
        res.status(404).send({
          message: `Cannot find user stat with id ${id}.`,
        });
      }
    })
    .catch(() =>
      res
        .status(500)
        .send({ message: `Error retrieving user stat with id ${id}` })
    );
};

// Update UserStat by id
exports.update = (req, res) => {
  const id = req.params.id;

  const updatedData = {
    timestamp: req.body.timestamp,
    weight: req.body.weight,
    height: req.body.height,
  };

  UserStats.update(updatedData, { where: { id: id } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "User stat updated successfully." });
      } else {
        res.status(404).send({
          message: `Cannot update user stat with id ${id}.`,
        });
      }
    })
    .catch(() =>
      res
        .status(500)
        .send({ message: `Error updating user stat with id ${id}` })
    );
};

// Delete UserStat by id
exports.delete = (req, res) => {
  const id = req.params.id;

  UserStats.destroy({ where: { id: id } })
    .then((num) => {
      if (num == 1) {
        res.send({ message: "User stat deleted successfully!" });
      } else {
        res.status(404).send({
          message: `Cannot delete user stat with id ${id}. It may not exist.`,
        });
      }
    })
    .catch(() =>
      res
        .status(500)
        .send({ message: `Unknown error deleting user stat with id ${id}` })
    );
};

export default exports;
