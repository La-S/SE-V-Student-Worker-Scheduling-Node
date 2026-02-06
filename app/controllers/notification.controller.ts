import pkg from 'express';
import { getMessaging } from "firebase-admin/messaging";
import { AppError } from '../error/app.error.ts';

const exports: any = {};

exports.globalNotification = async (req: pkg.Request, res: pkg.Response) => {
    if (!req.body.title || !req.body.body) {
        throw new AppError(400, `request body requires title and message`)
    }

    // console.log("GOT A PUSH TOKEN, gotta test it, right?");
    const message = {
        notification: {
            title: req.body.title,
            body: req.body.body,
        },
        topic: 'all-users'
    };
    const response = await getMessaging().send(message)
    if (response) {
        console.log("Successfully sent message: ", response)
    }
    console.log("sending to all-users!");
    res.send("ok");
};

exports.notificationByToken = async (req: pkg.Request, res: pkg.Response) => {
    if (!req.body.title || !req.body.body || !req.body.pushToken) {
        throw new AppError(400, `request body requires title, message, and pushToken`)
    }

    const message = {
        notification: {
            title: req.body.title,
            body: req.body.body,
        },
        token: req.body.pushToken
    };
    const response = await getMessaging().send(message)
    if (response) {
        console.log("Successfully sent message: ", response)
    }

    // console.log(userInfo);
    // res.send(userInfo);
    res.send("ok");
};




export default exports;
