import pkg from 'express';
import { getMessaging } from "firebase-admin/messaging";

const exports: any = {};

exports.globalNotification = async (req: pkg.Request, res: pkg.Response) => {
    if (!req.body.title || !req.body.body) {
        res.status(400).send({ message: `you need a title and message` });
        return;
    }
  
    // console.log("GOT A PUSH TOKEN, gotta test it, right?");
    const message = {
        notification: {
            title: req.body.title,
            body: req.body.body,
        },
        topic: 'all-users'
    };
    await getMessaging().send(message).then((response) => {
    // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
    });

    console.log("sending to all-users!");
    res.send("ok");
};

exports.notificationByToken = async (req: pkg.Request, res: pkg.Response) => {
    if (!req.body.title || !req.body.body || !req.body.pushToken) {
        res.status(400).send({ message: `you need a title, message, and pushToken` });
        return;
    }
  
    const message = {
        notification: {
            title: req.body.title,
            body: req.body.body,
        },
        token: req.body.pushToken
    };
    await getMessaging().send(message).then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
    });

    // console.log(userInfo);
    // res.send(userInfo);
    res.send("ok");
};




export default exports;
