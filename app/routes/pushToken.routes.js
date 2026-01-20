import users from "../controllers/user.controller.js";
import auth from "../authorization/authorization.js";
import { Router } from "express";
var router = Router()


// Add a push Token
router.post("/add/:token", [auth.authenticate], users.create);

// Delete a push Token
router.delete("/delete/:token", [auth.authenticate], users.findAll);

export default router;

