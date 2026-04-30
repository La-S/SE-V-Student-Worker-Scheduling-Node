export interface AnnouncementValuesType {
    id?: number,
    subject: string,
    body: string,
    authorId: number,
    businessUnit: number,
    priority: string, //or number?
    postAtDate: string,
    postAtTime: string,
}