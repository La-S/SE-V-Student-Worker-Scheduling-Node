export interface TimeClockValuesType {
    id?: number,
    employeeId: number,
    startDate: string,
    endDate: string,
    requestPostedDate: string,
    requestPostedTime: string,
    approval?: boolean,
    reviewedBy?: number,
    reviewedTime?: string,
    reviewedDate?: string,
    note: string
}