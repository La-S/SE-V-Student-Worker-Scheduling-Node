export interface SessionType {
    id?: number,
    email: string,
    token: string,
    expirationDate: Date,
    userId: number,
}