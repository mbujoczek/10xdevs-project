export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  id: number
  username: string
  token: string
  expiresAt: string
}

export interface RegisterRequest {
  username: string
  password: string
}

export interface RegisterResponse {
  id: number
  username: string
  token: string
  createdAtUtc: string
}

export interface User {
  id: number
  username: string
}
