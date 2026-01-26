import auth from "../controllers/auth.controller.js";
import { Router } from "express";
var router = Router()



// Login
router.post("/login", auth.login);

// Authorization
// router.post("/authorize/:id", auth.authorize);
// todo if want to use this address security concerns first

// Logout
router.post("/logout", auth.logout);

router.post("/authenticate", auth.getSessionValidity)

export default router

