export interface BusinessUnitType {
  id?: number,
  userId: number,
  businessUnitId: number,
  semester: string,
  currentlyEmployed: boolean,
  maxWeeklyHours: number,
  minWeeklyHours: number,
  isManager: boolean
}