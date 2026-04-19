import { Model, Op, type ModelStatic } from "sequelize";
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


export function getDateRange(startDate: String, endDate: String) {
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

export function convertTime(time: String) {
    //answer modified from https://stackoverflow.com/questions/15083548/convert-12-hour-hhmm-am-pm-to-24-hour-hhmm
    const hoursMins: string = time.slice(0, 5);
    const modifier: string = time.slice(5, 7);
    let hours : string = hoursMins.slice(0, 2);
    let mins: string = hoursMins.slice(2, 5);
    if (hours === "12") {
        hours = "00";
    }
    if (modifier === "PM") {
        hours = (parseInt(hours, 10) + 12).toString();
    }
    return hours + mins + ":00"
}

export function convertDayOfWeek(dayOfWeek: String) {
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

export function incrementSemester(semester: string){
    let term: string = semester.slice(0, 2);
    const year: string = semester.slice(2, 4);
    let yearInt: number = parseInt(year, 10);
    if (term == "FA"){
        yearInt++;
    }
    // FA -> SP and vice versa
    if (term == "FA")
        term = "SP";
    else
        term = "FA"
    return term.concat(yearInt.toString());
}
