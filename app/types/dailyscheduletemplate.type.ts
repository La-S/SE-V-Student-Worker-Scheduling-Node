import { DayOfWeek } from "./dayofweek.enum.ts";

export interface DailyScheduleTemplateValuesType {
  id?: number,
  weeklyScheduleTemplateId: number,
  dayOfWeek: DayOfWeek
}