import express from 'express'

export const errorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const statusCode = err.statusCode ?? 500;
    const message = err.message ?? "An error occurred"
    //delete in prod?
    console.log(statusCode+ ": " + message);
    res.status(statusCode).send({ message: message });
};