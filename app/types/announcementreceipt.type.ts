export interface AnnouncementReceipt{
    id?: number,
    announcementId: number,
    employeeId: number,
    //notified?
    read: boolean,
    deleted: boolean
}