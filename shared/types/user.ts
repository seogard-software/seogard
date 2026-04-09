export type AuthProvider = 'local' | 'google' | 'microsoft' | 'github'

export interface User {
  _id: string
  email: string
  name: string | null
  avatarUrl: string | null
  authProvider: AuthProvider
  totpEnabled: boolean
  createdAt: string
}

export interface AuthPayload {
  email: string
  password: string
}

export interface LoginResponse {
  user?: User
  requiresTwoFactor?: boolean
}
