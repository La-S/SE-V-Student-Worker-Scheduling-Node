export interface DropRequestType {
    id?: number,
    shiftId: number,
    requesterId: number,
    requestPostedTime: string,
    requestPostedDate: string,
    approval?: boolean,
    reviewedBy?: number,
    reviewedTime?: string,
    reviewedDate?: string,
    note: string
}