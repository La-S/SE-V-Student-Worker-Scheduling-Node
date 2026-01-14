import db from "../models/index.js";
const Set = db.set;
const Op = db.Sequelize.Op;
const exports = {};

// Create and Save a new set
exports.create = (req, res) => {

    // Create a set
    const set = convertToSnake(req.body);
    // Save set in the database
    Set.create(set)
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            if (err.name === 'SequelizeValidationError' || err.name === "SequelizeForeignKeyConstraintError") {
                res.status(400).send({
                    message: err.message
                });
                return;
            }
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the set.",
            });
        });
};

// Retrieve all sets from the database.
exports.findAll = (req, res) => {
    const id = req.query.id;
    var condition = id
        ? {
            id: {
                [Op.like]: `%${id}%`,
            },
        }
        : null;

    Set.findAll({ where: condition })
        .then((data) => {
            res.send(data);
        })
        .catch((err) => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving sets.",
            });
        });
};

// Find a single set with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Set.findByPk(id)
        .then((data) => {
            if (data) {
                res.send(data);
            } else {
                res.status(404).send({
                    message: `Cannot find set with id ${id}. set may not exist.`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `Error retrieving set with id ${id}`,
            });
        });
};

// Update a set by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    let updateInfo = convertToSnake(req.body)
    Set.update(updateInfo, {
        where: { id: id },
    })
        .then((num) => {
            if (num == 1) {
                res.send({
                    message: "set was updated successfully.",
                });
            } else {
                res.status(404).send({
                    message: `Cannot update set with id ${id}. set may not exist.`,
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
                message: `Error updating set with id ${id}`,
            });
        });
};

// Delete a set with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Set.destroy({
        where: { id: id },
    })
        .then((num) => {
            if (num == 1) {
                res.send({
                    message: "set was deleted successfully!",
                });
            } else {
                res.status(404).send({
                    message: `Cannot delete set with id ${id}. set may not exist.`,
                });
            }
        })
        .catch((err) => {
            res.status(500).send({
                message: `Unknown error deleting set with id ${id}`,
            });
        });
};

exports.createMany = async (req, res) => {
    let exerciseId = req.params.id;
    let sets = req.body;
    let savedSets = [];
    for (let set of sets) {
        set = convertToSnake(set);
        set.exercise_id = exerciseId;
        try {
            savedSets.push(await Set.create(set));
        }
        catch (err) {
            res.status(500).send({ message: err.message || "something went wrong bulk uploading exercises"});
            return;
        }
    }
    res.status(200).send(savedSets);

}

function convertToSnake(req) {
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
