import express from 'express'
import { logger } from '../logger/logger.ts';

export const errorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    err.name ?? ""
    if (err.name === 'SequelizeValidationError' || err.name === "SequelizeForeignKeyConstraintError"){
        err.statusCode = 400
    }

    const statusCode = err.statusCode ?? 500;
    const message = err.message ?? "An error occurred"
    //delete in prod?
    logger.log("error", statusCode+ ": " + message);
    logger.log("error", err);
    res.status(statusCode).send({ message: message });
};