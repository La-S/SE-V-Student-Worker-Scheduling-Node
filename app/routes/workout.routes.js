import workout from "../controllers/workout.controller.js";
import auth from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()

// Create a new workout
router.post("/", [auth.authenticate, auth.isCoachAdmin], workout.create);

// Find all the workouts
router.get("/", [auth.authenticate, auth.isCoachAdmin], workout.findAll);

// Retrieve a single workout with id
router.get("/:id", [auth.authenticate], workout.findOne);

// Update a workout with id
router.put("/:id", [auth.authenticate], workout.update);

// Delete a workout with id
router.delete("/:id", [auth.authenticate, auth.isCoachAdmin], workout.delete);

//get exercises in workout
router.get("/:id/exercises", [auth.authenticate], workout.getExercises);

//get workouts for user
router.get("/user/:id", [auth.authenticate], workout.getWorkoutsForUser);

//get workouts for user in date range
router.post("/user/:id/dated", [auth.authenticate], workout.getUserWorkoutsDated);

//get workouts for all users in a team in date range
router.post("/team/:id/dated", [auth.authenticate, auth.isCoachAdmin], workout.getTeamWorkoutsDated);

//add a workout to all users in a team
router.post("/:id/team/:teamId", [auth.authenticate, auth.isCoachAdmin], workout.assignWorkoutToTeam);

export default router
