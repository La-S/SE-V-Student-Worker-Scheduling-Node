import pkg from 'express';
import { Model, type ModelStatic, Op } from 'sequelize';
import { AppError } from '../error/app.error.ts';
import { getOneForId } from '../services/services.ts';

const exports: any = {};
exports.create = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const data: Model = await model.create(req.body)
    res.send(data);
}

exports.findAll = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    const data: Model[] = await model.findAll();
    res.send(data);
}

exports.findOne = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);
    const data: Model = await getOneForId(model, id);
    res.send(data);
}

exports.update = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);
    //throws error if not found
    await getOneForId(model, id);

    req.body.id = undefined;
    const numUpdated: number[] = await model.update(req.body, {
        where: { id: id },
    });
    if (numUpdated[0] <= 0) {
        throw new AppError(400, `Update ${model.name} for id ${id} did not update. Check request body.`);
    }
    let updatedObject: Model = await getOneForId(model, id);
    res.send(updatedObject);
}

exports.delete = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    const id: number = parseInt(req.params.id as string, 10);
    //throws error if not found
    await getOneForId(model, id);

    const numDeleted: number = await model.destroy({
        where: { id: id },
    })
    if (numDeleted <= 0) {
        throw new AppError(400, `Delete ${model.name} for id ${id} did not delete. Check request body.`);
    }
    res.status(200).send({ message: "Deleted successfully!" });
}


export default exports;
