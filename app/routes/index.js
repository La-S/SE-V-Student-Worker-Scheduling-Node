import { Router } from "express";

import AuthRoutes from "./auth.routes.js";
import UserRoutes from "./user.routes.js";
import WorkoutRoutes from "./workout.routes.js"
import TeamRoutes from "./team.routes.js";
import SetRoutes from "./set.routes.js"
import Exercise from "./exercise.routes.js";
import ExerciseTemplate from "./exerciseTemplate.routes.js";
import UserStats from "./userStats.routes.js";


const router = Router();

router.use("/", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/workout", WorkoutRoutes);
router.use("/exercise", Exercise);
router.use("/team", TeamRoutes);
router.use("/set", SetRoutes)
router.use("/exerciseTemplate", ExerciseTemplate);
router.use("/userStats", UserStats);

export default router;
