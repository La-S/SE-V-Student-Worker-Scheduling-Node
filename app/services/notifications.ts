import { getMessaging } from "firebase-admin/messaging";
import Employee from "../models/employee.model.ts";
import User from "../models/user.model.ts";

export async function sendNotificationToEmployee(employeeId: number, title: string, body: string) {
    const data = await Employee.findByPk(employeeId, {
        include: [{
            model: User
        }]
    });
    const pushToken: string | undefined = (data as any).dataValues.user.dataValues.pushToken;
    if (!pushToken) {
        console.warn(`Employee Id ${employeeId} has not signed up for push notifications.`);
        return false;
    }

    return await sendNotificationToToken(pushToken, title, body);
}

async function sendNotificationToToken(pushToken: string, title: string, body: string) {
    try {
        const message = {
            notification: {
                title: title,
                body: body,
            },
            token: pushToken
        };
        const response = await getMessaging().send(message);
        if (response) {
            console.log("Successfully sent message: ", response)
            return true;
        }
        return false;
    } catch (e) {
        console.error("Error sending push notification.", e);
        return false;
    }
}

