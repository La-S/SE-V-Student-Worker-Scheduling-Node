import { AppError } from "./app.error.ts";

export class NotFoundError extends AppError {
    constructor(model: string, id: number) {
        let message = model + " for id: " + id.toString() + " not found."
        super(404, message);
    }
}