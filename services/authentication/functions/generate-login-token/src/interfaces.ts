export interface IAuthUserData {
  user_id: string
  auth_code?: string[]
  scope: string
  is_blacklisted: boolean
  first_login: boolean
  email: string
  first_name: string
  last_name: string
}
