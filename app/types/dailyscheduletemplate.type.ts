import { DayOfWeek } from "./dayofweek.enum.ts";

export type DailyScheduleTemplateValuesType = {
  id?: number,
  weeklyScheduleTemplateId: number,
  dayOfWeek: DayOfWeek
}