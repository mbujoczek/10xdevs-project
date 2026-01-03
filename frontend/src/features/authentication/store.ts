import { loginUser, registerUser } from '@/api/auth.api'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
} from '@/types/auth.types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('authStore', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  const initializeAuth = () => {
    const storedToken = localStorage.getItem('authToken')
    const storedUser = localStorage.getItem('authUser')

    if (storedToken && storedUser) {
      token.value = storedToken
      user.value = JSON.parse(storedUser)
    }
  }

  const login = async (credentials: LoginRequest): Promise<void> => {
    const response: LoginResponse = await loginUser(credentials)

    user.value = {
      id: response.id,
      username: response.username,
    }
    token.value = response.token

    localStorage.setItem('authToken', response.token)
    localStorage.setItem('authUser', JSON.stringify(user.value))
  }

  const register = async (data: RegisterRequest): Promise<void> => {
    const response: RegisterResponse = await registerUser(data)

    user.value = {
      id: response.id,
      username: response.username,
    }
    token.value = response.token

    localStorage.setItem('authToken', response.token)
    localStorage.setItem('authUser', JSON.stringify(user.value))
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
  }

  initializeAuth()

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
  }
})
