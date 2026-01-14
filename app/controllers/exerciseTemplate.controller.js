import db from "../models/index.js";
const ExerciseTemplate = db.exerciseTemplate;
const Op = db.Sequelize.Op;
const exports = {};



// Create and Save a new Exercise Template
exports.create = (req, res) => {
  // Validate request
  if (!req.body.name) {
    res.status(400).send({
      message: "Content must have a name!",
    });
    return;
  }

  if (!req.body.type) {
    res.status(400).send({
      message: "Content must have a type!",
    });
    return;
  }

  if (req.body.type === "strength" && !req.body.muscle_group) {
    res.status(400).send({
      message: "Content must have a muscle_group if type is strength!",
    });
    return;
  }

  // Create an exerciseTemplate
  const exerciseTemplate = {
    name: req.body.name,
    type: req.body.type,
    muscle_group: req.body.muscle_group,
  };
  // Save exerciseTemplate in the database
  ExerciseTemplate.create(exerciseTemplate)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      if (err.name === 'SequelizeValidationError') {
        res.status(400).send({
          message: err.message
        });
        return;
      }
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the exercise template.",
      });
    });

};

// Retrieve all Exercise Templates from the database.
exports.findAll = (req, res) => {
  const id = req.query.id;
  var condition = id
    ? {
      id: {
        [Op.like]: `%${id}%`,
      },
    }
    : null;

  ExerciseTemplate.findAll({ where: condition })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving exercise templates.",
      });
    });
};

// Find a single exerciseTemplate with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  ExerciseTemplate.findByPk(id)
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find exercise template with id ${id}. exerciseTemplate may not exist.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: `Error retrieving exercise template with id ${id}`,
      });
    });
};

// Update a exerciseTemplate by the id in the request
exports.update = async (req, res) => {
  const id = req.params.id;
  let data = await ExerciseTemplate.findByPk(id);

  // Validate request
  if (!req.body.name && !req.body.type && !req.body.muscle_group) {
    res.status(400).send({
      message: "Content must have new data to update!",
    });
    return;
  }

  if (req.body.type === "strength" || (!req.body.type && data.type == "strength")) {
    if (!req.body.muscle_group) {
      res.status(400).send({
        message: "exercise type strength must have a muscle_group!",
      });
      return;
    }
  }

  const updatedData = {
    name: req.body.name ?? undefined,
    type: req.body.type ?? undefined,
    muscle_group: req.body.muscle_group,
  };

  ExerciseTemplate.update(updatedData, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "exerciseTemplate was updated successfully.",
        });
      } else {
        res.status(404).send({
          message: `Cannot update exercise template with id ${id}. exerciseTemplate may not exist.`,
        });
      }
    })
    .catch((err) => {
      if (err.name === 'SequelizeValidationError') {
        res.status(400).send({
          message: err.message
        })
      }
      else {
        res.status(500).send({
          message: `Error updating exercise template with id ${id}`,
        })
      };
    });
};

// Delete a exerciseTemplate with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  ExerciseTemplate.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "exerciseTemplate was deleted successfully!",
        });
      } else {
        res.status(404).send({
          message: `Cannot delete exercise template with id ${id}. exerciseTemplate may not exist.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: `Unknown error deleting exercise template with id ${id}`,
      });
    });
};

export default exports;
