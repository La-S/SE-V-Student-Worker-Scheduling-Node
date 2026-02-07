import pkg from 'express';
import { Model, type ModelStatic, Op } from 'sequelize';
import { AppError } from '../error/app.error.ts';
import { getOneForId } from '../services/services.ts';

const exports: any = {};
exports.create = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    req.body.id = undefined;
    const data = await model.create(req.body)
    res.send(data);
}

exports.findAll = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    const data = await model.findAll();
    res.send(data);
}

exports.findOne = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    const data = await getOneForId(model, id);
    res.send(data);
}

exports.update = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
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
}

exports.delete = (model: ModelStatic<Model>) => async (req: pkg.Request, res: pkg.Response) => {
    const id = parseInt(req.params.id, 10);
    //throws error if not found
    await getOneForId(model, id);

    const numDeleted = await model.destroy({
        where: { id: id },
    })
    if (numDeleted <= 0) {
        throw new AppError(400, `Delete ${model.name} for id ${id} did not delete. Check request body.`);
    }
    res.status(200).send({ message: "Deleted successfully!" });
}


export default exports;
