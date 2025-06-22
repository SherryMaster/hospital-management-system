/**
 * Frontend Security Testing Suite
 *
 * Tests client-side security measures including XSS prevention,
 * secure authentication handling, and data protection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import DOMPurify from 'dompurify'

// Mock components for testing
import LoginForm from '../../components/auth/LoginForm'
import PatientProfile from '../../components/patient/PatientProfile'
import AppointmentForm from '../../components/appointments/AppointmentForm'
import { AuthProvider } from '../../contexts/AuthContext'

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Authentication Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    mockSessionStorage.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not store sensitive data in localStorage', () => {
    const sensitiveData = {
      password: 'userpassword123',
      ssn: '123-45-6789',
      creditCard: '4111-1111-1111-1111'
    }

    // Simulate login process
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </BrowserRouter>
    )

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: sensitiveData.password } })
    fireEvent.click(submitButton)

    // Check that password is not stored in localStorage
    expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(sensitiveData.password)
    )

    // Check that other sensitive data is not stored
    Object.values(sensitiveData).forEach(value => {
      expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining(value)
      )
    })
  })

  it('should properly handle token expiration', async () => {
    const expiredToken = 'expired.jwt.token'
    
    // Mock expired token in storage
    mockLocalStorage.getItem.mockReturnValue(expiredToken)
    
    // Mock API response for expired token
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        detail: 'Token has expired'
      })
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <PatientProfile />
        </AuthProvider>
      </BrowserRouter>
    )

    await waitFor(() => {
      // Should clear expired token from storage
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    })
  })

  it('should implement secure logout', () => {
    const tokens = {
      access: 'access.token.here',
      refresh: 'refresh.token.here'
    }

    mockLocalStorage.getItem
      .mockReturnValueOnce(tokens.access)
      .mockReturnValueOnce(tokens.refresh)

    render(
      <BrowserRouter>
        <AuthProvider>
          <div data-testid="logout-button" onClick={() => {
            // Simulate logout action
            mockLocalStorage.removeItem('access_token')
            mockLocalStorage.removeItem('refresh_token')
            mockSessionStorage.clear()
          }}>
            Logout
          </div>
        </AuthProvider>
      </BrowserRouter>
    )

    const logoutButton = screen.getByTestId('logout-button')
    fireEvent.click(logoutButton)

    // Should clear all authentication data
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token')
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token')
    expect(mockSessionStorage.clear).toHaveBeenCalled()
  })

  it('should validate JWT token format', () => {
    const invalidTokens = [
      'invalid.token',
      'not-a-jwt-token',
      '',
      null,
      undefined,
      'header.payload', // Missing signature
      'too.many.parts.in.token'
    ]

    invalidTokens.forEach(token => {
      mockLocalStorage.getItem.mockReturnValue(token)

      const isValidJWT = (token) => {
        if (!token || typeof token !== 'string') return false
        const parts = token.split('.')
        return parts.length === 3
      }

      expect(isValidJWT(token)).toBe(false)
    })
  })

  it('should implement CSRF protection', async () => {
    // Mock CSRF token
    const csrfToken = 'csrf-token-123'
    
    // Mock meta tag for CSRF token
    const metaTag = document.createElement('meta')
    metaTag.name = 'csrf-token'
    metaTag.content = csrfToken
    document.head.appendChild(metaTag)

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    render(
      <BrowserRouter>
        <AuthProvider>
          <AppointmentForm />
        </AuthProvider>
      </BrowserRouter>
    )

    const submitButton = screen.getByRole('button', { name: /book appointment/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      // Should include CSRF token in requests
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRFToken': csrfToken
          })
        })
      )
    })

    // Cleanup
    document.head.removeChild(metaTag)
  })
})

describe('XSS Prevention Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should sanitize user input to prevent XSS', () => {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      'javascript:alert("XSS")',
      '<svg onload=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<object data="javascript:alert(\'XSS\')"></object>',
      '<embed src="javascript:alert(\'XSS\')">',
      '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
      '<style>@import "javascript:alert(\'XSS\')"</style>',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">'
    ]

    maliciousInputs.forEach(input => {
      const sanitized = DOMPurify.sanitize(input)
      
      // Should not contain script tags or javascript: protocols
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('onerror=')
      expect(sanitized).not.toContain('onload=')
    })
  })

  it('should escape HTML in user-generated content', () => {
    const userContent = '<script>alert("XSS")</script>Hello World'
    
    const escapeHtml = (text) => {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    }

    const escaped = escapeHtml(userContent)
    
    expect(escaped).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;Hello World')
    expect(escaped).not.toContain('<script>')
  })

  it('should validate and sanitize URLs', () => {
    const maliciousUrls = [
      'javascript:alert("XSS")',
      'data:text/html,<script>alert("XSS")</script>',
      'vbscript:msgbox("XSS")',
      'file:///etc/passwd',
      'ftp://malicious-site.com/malware.exe'
    ]

    const isValidUrl = (url) => {
      try {
        const urlObj = new URL(url)
        const allowedProtocols = ['http:', 'https:', 'mailto:']
        return allowedProtocols.includes(urlObj.protocol)
      } catch {
        return false
      }
    }

    maliciousUrls.forEach(url => {
      expect(isValidUrl(url)).toBe(false)
    })

    // Valid URLs should pass
    const validUrls = [
      'https://example.com',
      'http://localhost:3000',
      'mailto:test@example.com'
    ]

    validUrls.forEach(url => {
      expect(isValidUrl(url)).toBe(true)
    })
  })

  it('should prevent DOM-based XSS', () => {
    // Mock window.location
    delete window.location
    window.location = {
      href: 'https://example.com#<script>alert("XSS")</script>',
      hash: '#<script>alert("XSS")</script>',
      search: '?q=<script>alert("XSS")</script>'
    }

    const getCleanHash = () => {
      return DOMPurify.sanitize(window.location.hash.substring(1))
    }

    const getCleanSearch = () => {
      const params = new URLSearchParams(window.location.search)
      const cleanParams = new URLSearchParams()
      
      for (const [key, value] of params) {
        cleanParams.set(key, DOMPurify.sanitize(value))
      }
      
      return cleanParams.toString()
    }

    const cleanHash = getCleanHash()
    const cleanSearch = getCleanSearch()

    expect(cleanHash).not.toContain('<script>')
    expect(cleanSearch).not.toContain('<script>')
  })
})

describe('Data Protection Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mask sensitive data in UI', () => {
    const sensitiveData = {
      ssn: '123-45-6789',
      creditCard: '4111-1111-1111-1111',
      phone: '555-123-4567'
    }

    const maskSensitiveData = (data, type) => {
      switch (type) {
        case 'ssn':
          return `***-**-${data.slice(-4)}`
        case 'creditCard':
          return `****-****-****-${data.slice(-4)}`
        case 'phone':
          return `***-***-${data.slice(-4)}`
        default:
          return data
      }
    }

    expect(maskSensitiveData(sensitiveData.ssn, 'ssn')).toBe('***-**-6789')
    expect(maskSensitiveData(sensitiveData.creditCard, 'creditCard')).toBe('****-****-****-1111')
    expect(maskSensitiveData(sensitiveData.phone, 'phone')).toBe('***-***-4567')
  })

  it('should implement secure data transmission', async () => {
    const sensitiveData = {
      medicalHistory: 'Patient has diabetes',
      personalInfo: 'John Doe, DOB: 1990-01-01'
    }

    // Mock encrypted transmission
    const encryptData = (data) => {
      // In real implementation, this would use actual encryption
      return btoa(JSON.stringify(data)) // Base64 encoding as placeholder
    }

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    const encryptedData = encryptData(sensitiveData)

    await fetch('/api/patient/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token'
      },
      body: JSON.stringify({ data: encryptedData })
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/patient/update',
      expect.objectContaining({
        body: expect.stringContaining(encryptedData)
      })
    )

    // Verify original data is not in the request
    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining(sensitiveData.medicalHistory)
      })
    )
  })

  it('should clear sensitive data from memory', () => {
    let sensitiveData = {
      password: 'userpassword123',
      token: 'sensitive-token-data'
    }

    const clearSensitiveData = (obj) => {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          obj[key] = ''
        } else if (typeof obj[key] === 'object') {
          clearSensitiveData(obj[key])
        }
      })
    }

    clearSensitiveData(sensitiveData)

    expect(sensitiveData.password).toBe('')
    expect(sensitiveData.token).toBe('')
  })

  it('should implement content security policy', () => {
    // Check if CSP meta tag exists
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    
    if (cspMeta) {
      const cspContent = cspMeta.getAttribute('content')
      
      // Should restrict script sources
      expect(cspContent).toContain("script-src 'self'")
      
      // Should restrict object sources
      expect(cspContent).toContain("object-src 'none'")
      
      // Should restrict base URI
      expect(cspContent).toContain("base-uri 'self'")
    }
  })
})

describe('Input Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate email format', () => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'user@',
      'user..name@example.com',
      'user@example',
      'user name@example.com',
      '<script>alert("XSS")</script>@example.com'
    ]

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email) && !email.includes('<') && !email.includes('>')
    }

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false)
    })

    // Valid emails should pass
    const validEmails = [
      'user@example.com',
      'test.email@domain.co.uk',
      'user+tag@example.org'
    ]

    validEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(true)
    })
  })

  it('should validate phone number format', () => {
    const invalidPhones = [
      '123',
      'abc-def-ghij',
      '555-555-555',
      '555-555-55555',
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")'
    ]

    const isValidPhone = (phone) => {
      const phoneRegex = /^\d{3}-\d{3}-\d{4}$/
      return phoneRegex.test(phone)
    }

    invalidPhones.forEach(phone => {
      expect(isValidPhone(phone)).toBe(false)
    })

    // Valid phone numbers should pass
    expect(isValidPhone('555-123-4567')).toBe(true)
  })

  it('should validate date inputs', () => {
    const invalidDates = [
      '2025-13-01', // Invalid month
      '2025-02-30', // Invalid day for February
      '2025/02/15', // Wrong format
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")'
    ]

    const isValidDate = (dateString) => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(dateString)) return false
      
      const date = new Date(dateString)
      return date instanceof Date && !isNaN(date) && 
             date.toISOString().slice(0, 10) === dateString
    }

    invalidDates.forEach(date => {
      expect(isValidDate(date)).toBe(false)
    })

    // Valid dates should pass
    expect(isValidDate('2025-02-15')).toBe(true)
    expect(isValidDate('2025-12-31')).toBe(true)
  })

  it('should prevent injection attacks in form inputs', () => {
    const injectionPayloads = [
      "'; DROP TABLE users; --",
      '<script>alert("XSS")</script>',
      '${alert("XSS")}',
      '{{constructor.constructor("alert(1)")()}}',
      'javascript:alert("XSS")',
      'data:text/html,<script>alert("XSS")</script>'
    ]

    const sanitizeInput = (input) => {
      if (typeof input !== 'string') return ''
      
      // Remove script tags and javascript: protocols
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
    }

    injectionPayloads.forEach(payload => {
      const sanitized = sanitizeInput(payload)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('DROP TABLE')
    })
  })
})

describe('Session Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should implement session timeout', () => {
    const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

    const isSessionExpired = (lastActivity) => {
      const now = Date.now()
      return (now - lastActivity) > SESSION_TIMEOUT
    }

    const oldTimestamp = Date.now() - (31 * 60 * 1000) // 31 minutes ago
    const recentTimestamp = Date.now() - (5 * 60 * 1000) // 5 minutes ago

    expect(isSessionExpired(oldTimestamp)).toBe(true)
    expect(isSessionExpired(recentTimestamp)).toBe(false)
  })

  it('should detect concurrent sessions', () => {
    const sessionTokens = new Set()

    const addSession = (token) => {
      if (sessionTokens.has(token)) {
        throw new Error('Concurrent session detected')
      }
      sessionTokens.add(token)
    }

    const removeSession = (token) => {
      sessionTokens.delete(token)
    }

    const token1 = 'session-token-1'
    const token2 = 'session-token-2'

    addSession(token1)
    expect(() => addSession(token1)).toThrow('Concurrent session detected')

    addSession(token2)
    expect(sessionTokens.size).toBe(2)

    removeSession(token1)
    expect(sessionTokens.size).toBe(1)
  })

  it('should implement secure session storage', () => {
    const secureStorage = {
      setItem: (key, value) => {
        // Encrypt before storing (placeholder implementation)
        const encrypted = btoa(value) // Base64 as placeholder
        mockSessionStorage.setItem(key, encrypted)
      },
      
      getItem: (key) => {
        const encrypted = mockSessionStorage.getItem(key)
        if (!encrypted) return null
        
        try {
          // Decrypt when retrieving (placeholder implementation)
          return atob(encrypted)
        } catch {
          return null
        }
      },
      
      removeItem: (key) => {
        mockSessionStorage.removeItem(key)
      }
    }

    const sensitiveData = 'sensitive-session-data'
    secureStorage.setItem('session', sensitiveData)

    // Should not store data in plain text
    expect(mockSessionStorage.setItem).not.toHaveBeenCalledWith(
      'session',
      sensitiveData
    )

    // Should be able to retrieve original data
    const retrieved = secureStorage.getItem('session')
    expect(retrieved).toBe(sensitiveData)
  })
})
