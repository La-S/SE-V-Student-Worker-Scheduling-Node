import { AppError } from "../error/app.error.ts";
import Employee from "../models/employee.model.ts";
import db from "../models/index.ts";
import User from "../models/user.model.ts";
import { getOneForId } from "../services/services.ts";
import { type Request, type Response } from 'express';
const Position = db.Position

const errorClassName = "Position";

export async function update(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(Position,id);

    //an employee should refer to a userId and businessUnitId, these should not change
    req.body.businessUnitId = undefined;
    req.body.id = undefined;

    const numUpdated = await Position.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(409, `Update for id ${id} did not update. Check request body.`)
    }
    let updatedEmployee = await getOneForId(Position, id);
    res.send(updatedEmployee);
}

export async function findEmployees(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    await getOneForId(Position, id);

    const data = await Position.findAll({
        where:{id: id},
        include: [{
                model: Employee,
                include: [User]
            }]
    })
    res.send(data);
}

