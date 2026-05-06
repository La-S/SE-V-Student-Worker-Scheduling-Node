import { type Request, type Response } from 'express';
import { Model, type ModelStatic } from 'sequelize';
import { AppError } from '../error/app.error.ts';
import { getOneForId } from '../services/services.ts';

export function create(model: ModelStatic<Model>) {
    return async (req: Request, res: Response) => {
        req.body.id = undefined;
        const data = await model.create(req.body)
        res.send(data);
    };
}

export function findAll(model: ModelStatic<Model>) {
    return async (req: Request, res: Response) => {
        const data = await model.findAll();
        res.send(data);
    };
}

export function findOne(model: ModelStatic<Model>) {
    return async (req: Request, res: Response) => {
        const id = parseInt(req.params.id as string, 10);
        const data = await getOneForId(model, id);
        res.send(data);
    };
}

export function update(model: ModelStatic<Model>) {
    return async (req: Request, res: Response) => {
        const id = parseInt(req.params.id as string, 10);
        await getOneForId(model, id);

        req.body.id = undefined;
        const numUpdated = await model.update(req.body, {
            where: { id: id },
        });
        if (numUpdated[0] <= 0) {
            throw new AppError(400, `Update ${model.name} for id ${id} did not update. Check request body.`);
        }
        let updatedObject = await getOneForId(model, id);
        res.send(updatedObject);
    };
}

function del(model: ModelStatic<Model>) {
    return async (req: Request, res: Response) => {
        const id = parseInt(req.params.id as string, 10);
        await getOneForId(model, id);

        const numDeleted = await model.destroy({
            where: { id: id },
        })
        if (numDeleted <= 0) {
            throw new AppError(400, `Delete ${model.name} for id ${id} did not delete. Check request body.`);
        }
        res.status(200).send({ message: "Deleted successfully!" });
    };
}

export { del as delete };
