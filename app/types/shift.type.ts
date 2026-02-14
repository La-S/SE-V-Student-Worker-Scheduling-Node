export interface ShiftType {
    id?: number,
    employeeId?: number,
    positionId?: number,
    dailyScheduleTemplateId?: number
    businessUnitId: number,
    startTime: string,
    endTime: string,
    date?: string,
    published: boolean
}