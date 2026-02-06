import { AppError } from "./app.error.ts";

export class UnauthorizedError extends AppError {
    constructor(message: string) {
        super(401, message);
    }
}