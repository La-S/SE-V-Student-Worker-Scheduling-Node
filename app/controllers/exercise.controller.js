import db from "../models/index.js";
const Exercise = db.exercise;
const exerciseTemplate = db.exerciseTemplate
const Op = db.Sequelize.Op;
const Set = db.set;
const exports = {};

// Create and Save a new Exercise
exports.create = (req, res) => {
  // Validate request
  if (!req.body.workoutId) {
    res.status(400).send({
      message: "Content must have a workoutId!",
    });
    return;
  }

  if (req.body.exerciseTemplateId == null) {
    res.status(400).send({
      message: "Content must have a exerciseTemplateId!",
    });
    return;
  }

  // Create an exercise
  const exercise = convertToSnake(req.body);

  // Save exercise in the database
  Exercise.create(exercise)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the exercise.",
      });
    });
};

// Retrieve all Exercise from the database.
exports.findAll = (req, res) => {
  const id = req.query.id;
  var condition = id
    ? {
      id: {
        [Op.like]: `%${id}%`,
      },
    }
    : null;

  Exercise.findAll({ where: condition, include: exerciseTemplate })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving exercises.",
      });
    });
};

// Find a single exercise with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Exercise.findOne({ where: { id }, include: exerciseTemplate })
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find exercise with id ${id}. exercise may not exist.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: `Error retrieving exercise with id ${id}`,
      });
    });
};

// Update a exercise by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  // Validate request
  if (!req.body.workoutId && !req.body.exerciseTemplateId && !req.body.notes && !req.body.restTimer) {
    res.status(400).send({
      message: "Content must have new data to update!",
    });
    return;
  }

  const updatedData = convertToSnake(req.body);

  Exercise.update(updatedData, {
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "exercise was updated successfully.",
        });
      } else {
        res.status(404).send({
          message: `Cannot update exercise with id ${id}. exercise may not exist.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: `Error updating exercise with id ${id}`,
      });
    });
};

// Delete a exercise with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  Exercise.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.send({
          message: "exercise was deleted successfully!",
        });
      } else {
        res.status(404).send({
          message: `Cannot delete exercise with id ${id}. exercise may not exist.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: `Unknown error deleting exercise with id ${id}`,
      });
    });
};

exports.getSets = async (req, res) => {
  const id = req.params.id;
  const exercise = await Exercise.findByPk(id);
  if (!exercise) {
    res.status(404).send({ message: "exercise not found!" });
    return;
  }
  exercise.getSets()
    .then((data) =>
      res.status(200).send(data))
    .catch((err) => {
      res.status(500).send({
        message: `Unknown error getting sets`,
      });
    });
};

exports.createMany = async (req, res) => {
  let workoutId = req.params.id;
  let exercises = req.body;
  let savedExercises = [];
  for (let exercise of exercises) {
    exercise = convertToSnake(exercise);
    exercise.workout_id = workoutId;
    try {
      savedExercises.push(await Exercise.create(exercise));
    }
    catch (err) {
      res.status(500).send({ message: err.message || "something went wrong bulk uploading exercises" });
      return;
    }
  }
  res.status(200).send(savedExercises);
}

exports.createManyWithSets = async (req, res) => {
  let workoutId = req.params.id;
  let exercises = req.body;
  let savedExercises = [];
  for (let exercise of exercises) {
    let sets = exercise.sets;
    exercise = convertToSnake(exercise);
    exercise.workout_id = workoutId;
    try {
      let newExercise = await Exercise.create(exercise);
      let exerciseValues = newExercise.dataValues;
      exerciseValues.sets = [];
      let currentExerciseId = newExercise.dataValues.id;
      if (!sets){
        savedExercises.push(exerciseValues);
        continue;
      }
      for (let set of sets) {
        set = setConvertToSnake(set);
        set.exercise_id = currentExerciseId;
        let returnSet = await Set.create(set);
        let setValues = returnSet.dataValues;
        exerciseValues.sets.push(setValues);
      }
      savedExercises.push(exerciseValues);
    }
    catch (err) {
      res.status(500).send({ message: err.message || "something went wrong bulk uploading exercises" });
      return;
    }
  }
  res.status(200).send(savedExercises);
}

function convertToSnake(jsonData) {
  let exercise = {
    workout_id: jsonData.workoutId,
    exercise_template_id: jsonData.exerciseTemplateId,
    notes: jsonData.notes,
    rest_timer: jsonData.restTimer,
  };
  return exercise;
}

function setConvertToSnake(req) {
  let updateInfo = {};
  updateInfo.completed = req.completed ?? undefined;
  updateInfo.goal_weight = req.goalWeight ?? undefined;
  updateInfo.actual_weight = req.actualWeight ?? undefined;
  updateInfo.goal_reps = req.goalReps ?? undefined;
  updateInfo.actual_reps = req.actualReps ?? undefined;
  updateInfo.goal_dist = req.goalDist ?? undefined;
  updateInfo.actual_dist = req.actualDist ?? undefined;
  updateInfo.goal_time = req.goalTime ?? undefined;
  updateInfo.actual_time = req.actualTime ?? undefined;
  updateInfo.dist_units = req.distUnits ?? undefined;
  updateInfo.exercise_id = req.exerciseId;
  return updateInfo;
}

export default exports;
