import { Model, Op, type ModelStatic } from "sequelize";
import { AppError } from "../error/app.error.ts";
import { NotFoundError } from "../error/notfound.error.ts";

/**
 *
 * @param model The Sequelize Model to Query
 * @param id The PrimaryKey id
 * @returns the data
 * @throws an error if the pk is not found
 */
export async function getOneForId(model: ModelStatic<Model>, id: number) {
    if (!id) {
        throw new AppError(400, "id provided must be an integer")
    }
    const data: Model | null = await model.findByPk(id);
    if (!data) {
        throw new NotFoundError(model.name, id);
    }
    return data;
}

export async function getOneForStringId(model: ModelStatic<Model>, id: string) {
    if (!id) {
        throw new AppError(400, "id provided must be a string")
    }
    const data: Model | null = await model.findByPk(id);
    if (!data) {
        throw new AppError(404, `${model.name} for id ${id} not found`);
    }
    return data;
}

export function isSunday(date: Date) {
    const dayOfWeek: number = date.getDay();
    return (dayOfWeek == 0)
}

export function getSundayOfWeek(date: Date) {
    //https://stackoverflow.com/questions/4156434/javascript-get-the-first-day-of-the-week-from-current-date
    const dayOfWeek: number = date.getDay();
    const diff: number = date.getDate() - dayOfWeek;
    return new Date(date.setDate(diff));
}

export function getSaturdayOfWeek(date: Date) {
    //modified from stackoverflow answer in getSunday function
    const dayOfWeek: number = date.getDay();
    const diff: number = date.getDate() + (6 - dayOfWeek);
    return new Date(date.setDate(diff));
}

export function createDateFromString(dateString: string) {
    const date: Date = new Date(dateString + 'T00:00:00');
    if (!date || (date as any) == "Invalid Date") {
        throw new AppError(400, "Invalid date entered. Please enter YYYY-mm-dd format");
    }
    return date;
}

export function getStringFromDate(dateObject: Date) {
    if (!dateObject) {
        throw new AppError(400, "Invalid date entered. Please enter YYYY-mm-dd format")
    }
    return dateObject.toLocaleDateString("en-CA");
}


export function getDateRange(startDate: string, endDate: string) {
    if (!startDate && !endDate) {
        return {};
    }

    if (!startDate) {
        return { date: { [Op.lte]: endDate } };
    }

    if (!endDate) {
        return { date: { [Op.gte]: startDate } };
    }

    return { date: { [Op.between]: [startDate, endDate] } };
}

export function convertTime(time: string) {
    //answer modified from https://stackoverflow.com/questions/15083548/convert-12-hour-hhmm-am-pm-to-24-hour-hhmm
    const hoursMins: string = time.slice(0, 5);
    const modifier: string = time.slice(5, 7);
    let hours: string = hoursMins.slice(0, 2);
    let mins: string = hoursMins.slice(2, 5);
    if (hours === "12") {
        hours = "00";
    }
    if (modifier === "PM") {
        hours = (parseInt(hours, 10) + 12).toString();
    }
    return hours + mins + ":00"
}

export function toHours (time: string): number {
    const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);
    return hours + minutes / 60 + seconds / 3600;
};

export function convertDayOfWeek(dayOfWeek: string): string | undefined {
    switch (dayOfWeek) {
        case "M": return "Monday";
        case "T": return "Tuesday";
        case "W": return "Wednesday";
        case "TH": return "Thursday";
        case "F": return "Friday";
        case "S": return "Saturday";
        case "SU": return "Sunday";
    }
}

export function convertIntDayOfWeek(dayOfWeek: number): string {
    switch (dayOfWeek) {
        case 0: return "Sunday";
        case 1: return "Monday";
        case 2: return "Tuesday";
        case 3: return "Wednesday";
        case 4: return "Thursday";
        case 5: return "Friday";
        case 6: return "Saturday";
        default: throw new AppError(400, "Invalid day of week integer. Must be between 0 and 6 inclusive.");
    }
}

export function incrementSemester(semester: string): string {
    let term: string = semester.slice(0, 2);
    const year: string = semester.slice(2, 4);
    let yearInt: number = parseInt(year, 10);
    if (term == "FA") {
        yearInt++;
    }
    // FA -> SP and vice versa
    if (term == "FA")
        term = "SP";
    else
        term = "FA"
    return term.concat(yearInt.toString());
}
