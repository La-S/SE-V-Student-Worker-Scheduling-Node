import db from "../models/index.js";
const Workout = db.workout;
const exerciseTemplate = db.exerciseTemplate;
const Exercise = db.exercise;
const Set = db.set;
const Op = db.Sequelize.Op;
const User = db.user;
const Team = db.team;
const exports = {};

// Create and Save a new workout
exports.create = (req, res) => {

    // Create a workout
    const workout = convertToSnake(req.body);
    // Save workout in the database
    Workout.create(workout)
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
                message:
                    err.message || "Some error occurred while creating the workout.",
            });
        }
        );
};

// Retrieve all workouts from the database.
exports.findAll = (req, res) => {
    const id = req.query.id;
    var condition = id
        ? {
            id: {
                [Op.like]: `%${id}%`,
            },
        }
        : null;

    Workout.findAll({ where: condition })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving workouts.",
            });
        });
};

// Find a single workout with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Workout.findByPk(id)
        .then((data) => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `Cannot find workout with id ${id}. workout may not exist.`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `Error retrieving workout with id ${id}`,
            });
        });
};

// Update a workout by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    let updateInfo = convertToSnake(req.body)
    Workout.update(updateInfo, {
        where: { id: id },
    })
        .then((num) => {
            if (num == 1) {
                res.send({
                    message: "workout was updated successfully.",
                });
            } else {
                res.status(404).send({
                    message: `Cannot update workout with id ${id}. workout may not exist.`,
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
                message: `Error updating workout with id ${id}`,
            });
        });
};

// Delete a workout with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Workout.destroy({
        where: { id: id },
    })
        .then((num) => {
            if (num == 1) {
                res.send({
                    message: "workout was deleted successfully!",
                });
            } else {
                res.status(404).send({
                    message: `Cannot delete workout with id ${id}. workout may not exist.`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `Unknown error deleting workout with id ${id}`,
            });
        });
};

exports.getExercises = async (req, res) => {
    const id = req.params.id;
    const workout = await Workout.findByPk(id);
    if (!workout) {
        res.status(404).send({ message: "workout not found!" });
        return;
    }
    workout.getExercises({ include: [{model: exerciseTemplate}, {model: Set}] })
        .then((data) =>
            res.status(200).send(data))
        .catch((err) => {
            res.status(500).send({
                message: err.message || `Unknown error getting exercises`,
            });
        });
};


exports.getWorkoutsForUser = (req, res) => {
    const userId = req.params.id;
    const user = User.findByPk(userId);
    if (!user) {
        res.status(404).send({
            message: "user not found"
        })
        return;
    }
    Workout.findAll({ where: { user_id: userId } })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving workouts.",
            });
        });
}

exports.getUserWorkoutsDated = (req, res) => {
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let userId = req.params.id;
    const user = User.findByPk(userId);
    if (!user) {
        res.status(404).send({
            message: "user not found"
        })
        return;
    }
    Workout.findAll({ where: { user_id: userId, expected_date: { [Op.between]: [startDate, endDate] } } })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving workouts.",
            });
        });
};

exports.assignWorkoutToTeam = async (req, res) => {
    let workoutId = req.params.id;
    let teamId = req.params.teamId;
    let expectedWorkoutDate = req.body.date;

    let workoutToShare = await Workout.findByPk(workoutId);
    if (!workoutToShare) {
        res.status(404).send({ message: "workout not found" });
        return;
    }
    let workoutValues = workoutToShare.dataValues;

    let team = await Team.findByPk(teamId);
    if (!team) {
        res.status(404).send({ message: "team not found" });
        return;
    }

    let exercises = await workoutToShare.getExercises();
    try {
        let users = await team.getUsers();
        for (const user of users) {
            if (user.role == "admin" || user.role == "coach") {
                continue;
            }

            let currentWorkoutId = null;
            let newWorkout = JSON.parse(JSON.stringify(workoutValues));
            newWorkout.id = undefined;
            newWorkout.user_id = user.dataValues.id;
            newWorkout.parent_id = workoutValues.id;
            newWorkout.expected_date = expectedWorkoutDate;
            newWorkout.team_id = teamId;
            newWorkout = await Workout.create(newWorkout);
            currentWorkoutId = newWorkout.dataValues.id;

            for (const exercise of exercises) {
                let currentExerciseId = null;
                let exerciseValues = exercise.dataValues;
                let newExercise = JSON.parse(JSON.stringify(exerciseValues));
                let sets = await exercise.getSets();
                newExercise.workout_id = currentWorkoutId;
                newExercise.id = undefined;
                newExercise = await Exercise.create(newExercise);
                currentExerciseId = newExercise.dataValues.id;

                for (const set of sets) {
                    let setValues = set.dataValues;
                    setValues.exercise_id = currentExerciseId;
                    setValues.id = undefined;
                    await Set.create(setValues);
                }
            }
        }
        res.status(200).send({ message: "workout shared successfully" });
        return;
    }
    catch (err) {
        res.status(500).send({ message: err.message || "Something went wrong sharing the workout with the team" });
        return;
    }
};

exports.getTeamWorkoutsDated = async (req, res) => {
    const id = req.params.id;
    const startDate = req.body.startDate;
    const endDate = req.body.endDate;
    const team = await Team.findByPk(id);
    let workouts = [];
    if (!team) {
        res.status(404).send({ message: "team not found!" });
        return;
    }
    try{
        workouts = await team.getWorkouts({where : {expected_date: { [Op.between]: [startDate, endDate] }}});
        res.status(200).send(workouts);
    }
    catch(err){
        res.status(500).send({message: err.message || "Something went wrong getting workouts for the team"});
    }
};

function convertToSnake(req) {
    let updateInfo = {};
    updateInfo.parent_id = req.parentId ?? undefined;
    updateInfo.user_id = req.userId ?? undefined;
    updateInfo.coach_id = req.coachId ?? undefined;
    updateInfo.notes = req.notes ?? undefined;
    updateInfo.expected_date = req.expectedDate ?? undefined;
    updateInfo.date = req.date ?? undefined;
    updateInfo.total_time = req.totalTime ?? undefined;
    updateInfo.focus_area = req.focusArea ?? undefined;
    updateInfo.team_id = req.teamId ?? undefined;
    return updateInfo;
}

export default exports;
