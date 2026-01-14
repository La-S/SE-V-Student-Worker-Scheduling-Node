import userStats from "../controllers/userStats.controller.js";
import auth from "../authorization/authorization.js";
import { Router } from "express";

var router = Router();

// Create new user stat
router.post("/", [auth.authenticate], userStats.create);

// Get all stats 
router.get("/", [auth.authenticate], userStats.findAll);

// Get one stat
router.get("/:id", [auth.authenticate], userStats.findOne);

// Update stat
router.put("/:id", [auth.authenticate], userStats.update);

// Delete stat
router.delete("/:id", [auth.authenticate], userStats.delete);

export default router;
