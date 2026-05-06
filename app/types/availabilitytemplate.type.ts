import { AvailabilityPreference } from "./availabilitypreference.enum.ts";
import { DayOfWeek } from "./dayofweek.enum.ts";

export type AvailabilityTemplateValuesType = {
    id? : number,
    userId: number,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string, 
    preference: AvailabilityPreference
}