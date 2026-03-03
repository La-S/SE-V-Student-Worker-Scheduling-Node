import { Model, type ModelStatic } from "sequelize";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";

export async function getOneForId(model: ModelStatic<Model>, id: number) {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data = await model.findByPk(id);
    if (!data) {
        throw new NotFoundError(model.name, id);
    }
    return data;
}

export function isSunday(date: Date) {
    const dayOfWeek = date.getDay();
    return (dayOfWeek == 0)
}

export function createDateFromString(dateString: string) {
    const date = new Date(dateString + 'T00:00:00');
    if (!date) {
        throw new AppError(400, "Invalid date entered. Please enter YYYY-mm-dd format");
    }
    return date;
}

export function getStringFromDate(dateObject: Date) {
    if (!dateObject){
        throw new AppError(400, "Invalid date entered. Please enter YYYY-mm-dd format")
    }
    return dateObject.toLocaleDateString("en-CA");
}
