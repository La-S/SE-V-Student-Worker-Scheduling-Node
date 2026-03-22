export interface CoverRequestType {
    id?: number,
    shiftId: number,
    requesterId: number,
    requestPostedTime: string,
    requestPostedDate: string,
    accepterId?: number,
    acceptTime?: string,
    acceptDate?: string,
    approval?: boolean,
    reviewedBy?: number,
    reviewedTime?: string,
    reviewedDate?: string,
    note?: string
}