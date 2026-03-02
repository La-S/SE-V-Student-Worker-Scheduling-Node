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

export function createDateFromString(date: string){
    return new Date(date + 'T00:00:00');
}

export function getStringFromDate(date: Date){
    return date.toLocaleDateString("en-CA");
}