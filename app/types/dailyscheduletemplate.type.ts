import { DayOfWeek } from "./dayofweek.enum.ts";

export interface DailyScheduleTemplateType {
  id?: number,
  weeklyScheduleTemplateId: number,
  dayOfWeek: DayOfWeek
}