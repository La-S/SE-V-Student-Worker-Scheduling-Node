export interface UserType {
  id?: number,
  firstName: string,
  lastName: string,
  email: string,
  ocID?: string,
  isAdmin: boolean,
  pushToken?: string
}