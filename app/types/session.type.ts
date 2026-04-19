export interface SessionType {
    id?: number,
    email: string,
    token: string | null,
    expirationDate: Date,
    userId: number,
}