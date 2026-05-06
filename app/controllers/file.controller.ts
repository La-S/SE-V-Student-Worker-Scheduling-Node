import { type Request, type Response } from 'express';
import { Model, type ModelStatic, Op } from 'sequelize';
import { AppError } from '../error/app.error.ts';
import { getOneForId } from '../services/services.ts';
import File, { type FileType } from "../models/file.model.ts"
import { NotFoundError } from '../error/notfound.error.ts';


export async function findOne(req: Request, res: Response) {
    const data: FileType = await getFile(req.params.id);
    res.send(data);
}


async function del(req: Request, res: Response) {
    //throws error if not found
    const id: string = req.params.id;
    await getFile(id);

    const numDeleted: number = await File.destroy({
        where: { id: id },
    })
    if (numDeleted <= 0) {
        throw new AppError(400, `Delete File for id ${id} did not delete. Check request body.`);
    }
    res.status(200).send({ message: "Deleted successfully!" });
}

async function getFile(id: string) {
    const data: FileType | null = await File.findOne({ where: { id: id } });
    if (!data) {
        throw new AppError(404, `File for id ${id} not found`);
    }
    return data;
}


export { del as delete };
