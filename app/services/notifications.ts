import { getMessaging, type Message } from "firebase-admin/messaging";
import Employee from "../models/employee.model.ts";
import User from "../models/user.model.ts";
import BusinessUnit from "../models/businessunit.model.ts";
import { Op } from "sequelize";

export async function sendNotificationToEmployee(employeeId: number, title: string, body: string) {
    const data = await Employee.findByPk(employeeId, {
        include: [User]
    });
    const pushToken: string | undefined = (data as any).dataValues.user.dataValues.pushToken;
    if (!pushToken) {
        console.warn(`Employee Id ${employeeId} has not signed up for push notifications.`);
        return false;
    }

    return await sendNotificationToToken(pushToken, title, body);
}

export async function sendNotificationToManagers(businessUnitId: number, title: string, body: string) {
    const data = await BusinessUnit.findByPk(businessUnitId, {
        include: [
            {
                model: Employee,
                include: [User],
                where: {
                    currentlyEmployed: true,
                    isManager: true,
                }
            }
        ],
    });
    let employees = (data as any)?.dataValues?.employees;
    if (!employees) {
        console.warn("data not found, trying to send a notification to managers.")
        return;
    }
    for (let employee of (data as any)?.dataValues?.employees) {
        let pushToken = employee.dataValues.user.dataValues.pushToken;
         if (!pushToken) {
            console.warn(`Employee Id ${employee.dataValues.id} has not signed up for push notifications.`);
            continue;
        }
        sendNotificationToToken(pushToken, title, body);
    }
    return;
}

export async function sendNotificationToBusinessUnit(businessUnitId: number, forWeekOf: string) {
    const data = await BusinessUnit.findByPk(businessUnitId, {
        include: [
            {
                model: Employee,
                include: [User],
                where: {
                    currentlyEmployed: true,
                }
            }
        ],
    });
    for (let employee of (data as any).dataValues.employees) {
        let pushToken = employee.dataValues.user.dataValues.pushToken;
         if (!pushToken) {
            console.warn(`Employee Id ${employee.dataValues.id} has not signed up for push notifications.`);
            continue;
        }
        sendNotificationToToken(pushToken, "Shifts Published", `Shifts have been published for the week of ${forWeekOf}`);
    }
    return;
}

export async function sendNotificationToOtherEmployees(employeeId: number, businessUnitId: number, title: string, body: string) {
    const data = await BusinessUnit.findByPk(businessUnitId, {
        include: [
            {
                model: Employee,
                include: [User],
                where: {
                    currentlyEmployed: true,
                    id: { [Op.ne]: employeeId },
                }
            }
        ],
    });
    for (let employee of (data as any).dataValues.employees) {
        let pushToken = employee.dataValues.user.dataValues.pushToken;
         if (!pushToken) {
            console.warn(`Employee Id ${employee.dataValues.id} has not signed up for push notifications.`);
            continue;
        }
        sendNotificationToToken(pushToken, title, body);
    }
    return;
}

async function sendNotificationToToken(pushToken: string, title: string, body: string) {
    try {
        const message: Message = {
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

