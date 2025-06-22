/**
 * API Error Handling Integration Tests
 * 
 * Tests error scenarios, network failures, and edge cases in API communication
 * Validates proper error handling and user feedback mechanisms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient } from '../../services/api'

// Mock fetch for controlled testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Network Errors', () => {
    it('should handle network connection failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'))

      await expect(
        apiClient.get('/api/appointments/')
      ).rejects.toThrow('Network error: Failed to fetch')
    })

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      )

      await expect(
        apiClient.get('/api/appointments/')
      ).rejects.toThrow('Request timeout')
    })

    it('should handle DNS resolution failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND'))

      await expect(
        apiClient.get('/api/appointments/')
      ).rejects.toThrow('Network error')
    })

    it('should handle CORS errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(
        apiClient.get('/api/appointments/')
      ).rejects.toThrow('Network error')
    })
  })

  describe('HTTP Status Code Handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      const mockErrorResponse = {
        detail: 'Invalid request data',
        errors: {
          email: ['This field is required'],
          password: ['This field may not be blank']
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.post('/api/auth/login/', {
          email: '',
          password: ''
        })
      } catch (error) {
        expect(error.status).toBe(400)
        expect(error.message).toContain('Invalid request data')
        expect(error.errors).toEqual(mockErrorResponse.errors)
      }
    })

    it('should handle 401 Unauthorized errors', async () => {
      const mockErrorResponse = {
        detail: 'Authentication credentials were not provided.'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.get('/api/appointments/')
      } catch (error) {
        expect(error.status).toBe(401)
        expect(error.message).toContain('Authentication credentials')
      }
    })

    it('should handle 403 Forbidden errors', async () => {
      const mockErrorResponse = {
        detail: 'You do not have permission to perform this action.'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.delete('/api/appointments/1/')
      } catch (error) {
        expect(error.status).toBe(403)
        expect(error.message).toContain('permission')
      }
    })

    it('should handle 404 Not Found errors', async () => {
      const mockErrorResponse = {
        detail: 'Not found.'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.get('/api/appointments/999/')
      } catch (error) {
        expect(error.status).toBe(404)
        expect(error.message).toContain('Not found')
      }
    })

    it('should handle 409 Conflict errors', async () => {
      const mockErrorResponse = {
        detail: 'Appointment conflict detected',
        conflict_details: {
          existing_appointment: {
            id: 1,
            time: '10:00:00',
            date: '2025-06-25'
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.post('/api/appointments/', {
          doctor: 1,
          appointment_date: '2025-06-25',
          appointment_time: '10:00:00'
        })
      } catch (error) {
        expect(error.status).toBe(409)
        expect(error.message).toContain('conflict')
        expect(error.conflict_details).toBeDefined()
      }
    })

    it('should handle 422 Unprocessable Entity errors', async () => {
      const mockErrorResponse = {
        detail: 'Validation failed',
        validation_errors: {
          appointment_date: ['Cannot book appointments in the past'],
          appointment_time: ['Invalid time format']
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.post('/api/appointments/', {
          appointment_date: '2025-06-20',
          appointment_time: '25:00'
        })
      } catch (error) {
        expect(error.status).toBe(422)
        expect(error.validation_errors).toBeDefined()
      }
    })

    it('should handle 429 Rate Limit errors', async () => {
      const mockErrorResponse = {
        detail: 'Request was throttled. Expected available in 60 seconds.'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json',
          'Retry-After': '60'
        })
      })

      try {
        await apiClient.post('/api/auth/login/', {
          email: 'test@example.com',
          password: 'password'
        })
      } catch (error) {
        expect(error.status).toBe(429)
        expect(error.message).toContain('throttled')
        expect(error.retryAfter).toBe('60')
      }
    })

    it('should handle 500 Internal Server errors', async () => {
      const mockErrorResponse = {
        detail: 'Internal server error occurred'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.get('/api/appointments/')
      } catch (error) {
        expect(error.status).toBe(500)
        expect(error.message).toContain('server error')
      }
    })

    it('should handle 502 Bad Gateway errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: async () => '<html><body>502 Bad Gateway</body></html>',
        headers: new Headers({
          'Content-Type': 'text/html'
        })
      })

      try {
        await apiClient.get('/api/appointments/')
      } catch (error) {
        expect(error.status).toBe(502)
        expect(error.message).toContain('Bad Gateway')
      }
    })

    it('should handle 503 Service Unavailable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({
          detail: 'Service temporarily unavailable'
        }),
        headers: new Headers({
          'Content-Type': 'application/json',
          'Retry-After': '300'
        })
      })

      try {
        await apiClient.get('/api/appointments/')
      } catch (error) {
        expect(error.status).toBe(503)
        expect(error.message).toContain('unavailable')
        expect(error.retryAfter).toBe('300')
      }
    })
  })

  describe('Response Format Errors', () => {
    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => {
          throw new Error('Unexpected token in JSON')
        },
        text: async () => 'Invalid JSON response',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.get('/api/appointments/')
      } catch (error) {
        expect(error.message).toContain('Invalid response format')
      }
    })

    it('should handle empty response bodies', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Unexpected end of JSON input')
        },
        text: async () => '',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.get('/api/appointments/')
      } catch (error) {
        expect(error.message).toContain('Empty response')
      }
    })

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => '<html><body>Internal Server Error</body></html>',
        headers: new Headers({
          'Content-Type': 'text/html'
        })
      })

      try {
        await apiClient.get('/api/appointments/')
      } catch (error) {
        expect(error.status).toBe(500)
        expect(error.message).toContain('Server error')
      }
    })
  })

  describe('Token Expiration and Refresh', () => {
    it('should handle expired access token', async () => {
      // First request fails with 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            detail: 'Given token not valid for any token type',
            code: 'token_not_valid'
          }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })
        // Token refresh succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            access: 'new-access-token'
          }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })
        // Retry original request succeeds
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            results: []
          }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })

      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('refresh-token'),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      })

      const result = await apiClient.get('/api/appointments/', {
        headers: {
          'Authorization': 'Bearer expired-token'
        }
      })

      expect(result.results).toEqual([])
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'access_token',
        'new-access-token'
      )
    })

    it('should handle expired refresh token', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            detail: 'Given token not valid for any token type',
            code: 'token_not_valid'
          }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            detail: 'Token is invalid or expired',
            code: 'token_not_valid'
          }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })

      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue('expired-refresh-token'),
        removeItem: vi.fn()
      }
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage
      })

      try {
        await apiClient.get('/api/appointments/', {
          headers: {
            'Authorization': 'Bearer expired-token'
          }
        })
      } catch (error) {
        expect(error.status).toBe(401)
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token')
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token')
      }
    })
  })

  describe('Retry Logic', () => {
    it('should retry failed requests with exponential backoff', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })

      const result = await apiClient.get('/api/appointments/', {
        retry: {
          attempts: 3,
          delay: 100
        }
      })

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('should not retry on 4xx client errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          detail: 'Bad request'
        }),
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      try {
        await apiClient.get('/api/appointments/', {
          retry: {
            attempts: 3
          }
        })
      } catch (error) {
        expect(error.status).toBe(400)
        expect(mockFetch).toHaveBeenCalledTimes(1)
      }
    })

    it('should retry on 5xx server errors', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({
            detail: 'Internal server error'
          }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
          headers: new Headers({
            'Content-Type': 'application/json'
          })
        })

      const result = await apiClient.get('/api/appointments/', {
        retry: {
          attempts: 2
        }
      })

      expect(result.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
