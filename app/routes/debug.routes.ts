import * as debug from "../controllers/debug.controller.ts";
import * as generalcontroller from "../controllers/general.controller.ts"
import UserModel from "../models/user.model.ts"
import { Router } from "express";
var router = Router()

router.post("/bdiohjaiofjas/createSession", debug.debugCreateSession)

router.post("/bdiohjaiofjas/user", debug.debugCreateUser)

router.get("/bdiohjaiofjas/user/email/:email", debug.debugFindUserByEmail)

router.post("/bdiohjaiofjas/email", debug.debugSendEmail)

router.delete("/bdiohjaiofjas/user/:id", generalcontroller.delete(UserModel))



export default router;
