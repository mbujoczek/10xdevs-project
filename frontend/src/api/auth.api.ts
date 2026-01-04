import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/auth.types'
import api from './axios'

export const loginUser = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', credentials)
  return response.data
}

export const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await api.post<RegisterResponse>('/auth/register', data)
  return response.data
}
