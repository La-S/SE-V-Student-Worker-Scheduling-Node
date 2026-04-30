export interface SessionValuesType {
    id?: number,
    email: string,
    token: string | null,
    expirationDate: Date,
    userId: number,
}