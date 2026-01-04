import * as authApi from '@/api/auth.api'
import type { LoginResponse } from '@/types/auth.types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../store'

vi.mock('@/api/auth.api', () => ({
  loginUser: vi.fn(),
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('has null user and token when no data in localStorage', () => {
      const store = useAuthStore()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('loads user and token from localStorage on init', () => {
      const mockUser = { id: 1, username: 'testuser' }
      const mockToken = 'test-token-123'

      localStorage.setItem('authToken', mockToken)
      localStorage.setItem('authUser', JSON.stringify(mockUser))

      const store = useAuthStore()

      expect(store.user).toEqual(mockUser)
      expect(store.token).toBe(mockToken)
      expect(store.isAuthenticated).toBe(true)
    })
  })

  describe('login', () => {
    it('saves user and token on successful login', async () => {
      const mockResponse: LoginResponse = {
        id: 1,
        username: 'testuser',
        token: 'jwt-token-123',
        expiresAt: '2026-01-03T00:00:00Z',
      }

      vi.mocked(authApi.loginUser).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      await store.login({ username: 'testuser', password: 'password123' })

      expect(store.user).toEqual({
        id: 1,
        username: 'testuser',
      })
      expect(store.token).toBe('jwt-token-123')
      expect(store.isAuthenticated).toBe(true)
    })

    it('persists token and user to localStorage', async () => {
      const mockResponse: LoginResponse = {
        id: 1,
        username: 'testuser',
        token: 'jwt-token-123',
        expiresAt: '2026-01-03T00:00:00Z',
      }

      vi.mocked(authApi.loginUser).mockResolvedValue(mockResponse)

      const store = useAuthStore()
      await store.login({ username: 'testuser', password: 'password123' })

      expect(localStorage.getItem('authToken')).toBe('jwt-token-123')
      expect(localStorage.getItem('authUser')).toBe(JSON.stringify({ id: 1, username: 'testuser' }))
    })

    it('throws error when login fails', async () => {
      const error = new Error('Invalid credentials')
      vi.mocked(authApi.loginUser).mockRejectedValue(error)

      const store = useAuthStore()

      await expect(store.login({ username: 'testuser', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials',
      )
    })
  })

  describe('logout', () => {
    it('clears user and token', () => {
      const store = useAuthStore()

      store.user = { id: 1, username: 'testuser' }
      store.token = 'jwt-token-123'

      store.logout()

      expect(store.user).toBeNull()
      expect(store.token).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })

    it('removes token and user from localStorage', () => {
      localStorage.setItem('authToken', 'jwt-token-123')
      localStorage.setItem('authUser', JSON.stringify({ id: 1, username: 'testuser' }))

      const store = useAuthStore()
      store.logout()

      expect(localStorage.getItem('authToken')).toBeNull()
      expect(localStorage.getItem('authUser')).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('returns true when token exists', () => {
      const store = useAuthStore()
      store.token = 'jwt-token-123'

      expect(store.isAuthenticated).toBe(true)
    })

    it('returns false when token is null', () => {
      const store = useAuthStore()
      store.token = null

      expect(store.isAuthenticated).toBe(false)
    })
  })
})
