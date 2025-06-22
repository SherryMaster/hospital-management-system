/**
 * Authentication API Integration Tests
 * 
 * Tests complete authentication flow between frontend and backend
 * Validates JWT token handling, user registration, and session management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authAPI } from '../../services/api'

// Mock fetch for controlled testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Authentication API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('User Registration', () => {
    it('should register new user successfully', async () => {
      const mockResponse = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'patient'
        },
        access: 'mock-access-token',
        refresh: 'mock-refresh-token'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!',
        first_name: 'Test',
        last_name: 'User',
        role: 'patient'
      }

      const result = await authAPI.register(userData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(userData)
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle registration validation errors', async () => {
      const mockErrorResponse = {
        email: ['User with this email already exists.'],
        username: ['This field must be unique.'],
        password: ['This password is too common.']
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const userData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      }

      await expect(authAPI.register(userData)).rejects.toThrow()
    })

    it('should handle network errors during registration', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'SecurePass123!'
      }

      await expect(authAPI.register(userData)).rejects.toThrow('Network error')
    })
  })

  describe('User Login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'patient'
        },
        access: 'mock-access-token',
        refresh: 'mock-refresh-token'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const credentials = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      }

      const result = await authAPI.login(credentials)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(credentials)
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle invalid credentials', async () => {
      const mockErrorResponse = {
        detail: 'Invalid email or password'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const credentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      }

      await expect(authAPI.login(credentials)).rejects.toThrow()
    })

    it('should handle account deactivation', async () => {
      const mockErrorResponse = {
        detail: 'Account has been deactivated'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const credentials = {
        email: 'deactivated@example.com',
        password: 'password123'
      }

      await expect(authAPI.login(credentials)).rejects.toThrow()
    })
  })

  describe('Token Management', () => {
    it('should refresh access token successfully', async () => {
      const mockResponse = {
        access: 'new-access-token'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const refreshToken = 'mock-refresh-token'
      const result = await authAPI.refreshToken(refreshToken)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/token/refresh/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ refresh: refreshToken })
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle expired refresh token', async () => {
      const mockErrorResponse = {
        detail: 'Token is invalid or expired',
        code: 'token_not_valid'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const expiredToken = 'expired-refresh-token'

      await expect(authAPI.refreshToken(expiredToken)).rejects.toThrow()
    })

    it('should verify token successfully', async () => {
      const mockResponse = {
        user_id: 1,
        username: 'testuser',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const token = 'valid-access-token'
      const result = await authAPI.verifyToken(token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/token/verify/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ token })
        })
      )

      expect(result).toEqual(mockResponse)
    })
  })

  describe('User Profile Management', () => {
    it('should fetch user profile successfully', async () => {
      const mockResponse = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'patient',
        is_active: true,
        date_joined: '2025-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const token = 'valid-access-token'
      const result = await authAPI.getProfile(token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/profile/'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          })
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should update user profile successfully', async () => {
      const mockResponse = {
        id: 1,
        username: 'testuser',
        email: 'updated@example.com',
        first_name: 'Updated',
        last_name: 'User',
        role: 'patient'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const token = 'valid-access-token'
      const updateData = {
        email: 'updated@example.com',
        first_name: 'Updated'
      }

      const result = await authAPI.updateProfile(token, updateData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/profile/'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(updateData)
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle unauthorized access to profile', async () => {
      const mockErrorResponse = {
        detail: 'Authentication credentials were not provided.'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      await expect(authAPI.getProfile('invalid-token')).rejects.toThrow()
    })
  })

  describe('Password Management', () => {
    it('should change password successfully', async () => {
      const mockResponse = {
        detail: 'Password changed successfully'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const token = 'valid-access-token'
      const passwordData = {
        old_password: 'oldpassword123',
        new_password: 'newpassword123'
      }

      const result = await authAPI.changePassword(token, passwordData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/change-password/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(passwordData)
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle incorrect old password', async () => {
      const mockErrorResponse = {
        old_password: ['Current password is incorrect']
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const token = 'valid-access-token'
      const passwordData = {
        old_password: 'wrongpassword',
        new_password: 'newpassword123'
      }

      await expect(authAPI.changePassword(token, passwordData)).rejects.toThrow()
    })
  })
})
