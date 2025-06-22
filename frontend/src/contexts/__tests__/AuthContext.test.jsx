/**
 * AuthContext Tests
 * 
 * Tests for the authentication context functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders, mockUsers, mockFetch, userEvent } from '../../test/utils'
import { useAuth } from '../AuthContext'

// Test component to use the auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth()
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not authenticated'}
      </div>
      <div data-testid="user-info">
        {user ? `${user.first_name} ${user.last_name}` : 'No user'}
      </div>
      <div data-testid="loading-status">
        {isLoading ? 'loading' : 'not loading'}
      </div>
      <button 
        data-testid="login-button" 
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>
      <button 
        data-testid="logout-button" 
        onClick={logout}
      >
        Logout
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('provides initial unauthenticated state', () => {
    renderWithProviders(<TestComponent />)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('No user')
    expect(screen.getByTestId('loading-status')).toHaveTextContent('not loading')
  })

  it('provides authenticated state when user is logged in', () => {
    renderWithProviders(<TestComponent />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('Jane Doe')
  })

  it('handles login functionality', async () => {
    const user = userEvent.setup()
    mockFetch({
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      user: mockUsers.patient
    })

    renderWithProviders(<TestComponent />)
    
    const loginButton = screen.getByTestId('login-button')
    await user.click(loginButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login/'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })

  it('handles logout functionality', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<TestComponent />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })
    
    const logoutButton = screen.getByTestId('logout-button')
    await user.click(logoutButton)
    
    // Should clear authentication state
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated')
  })

  it('shows loading state during authentication', () => {
    // Mock loading state
    renderWithProviders(<TestComponent />)
    
    // Initially should not be loading
    expect(screen.getByTestId('loading-status')).toHaveTextContent('not loading')
  })

  it('persists authentication state in localStorage', () => {
    // Mock localStorage with existing token
    localStorage.setItem('hospital_auth_token', 'existing-token')
    
    renderWithProviders(<TestComponent />)
    
    // Should attempt to validate existing token
    expect(localStorage.getItem('hospital_auth_token')).toBe('existing-token')
  })

  it('clears localStorage on logout', async () => {
    const user = userEvent.setup()
    localStorage.setItem('hospital_auth_token', 'test-token')
    
    renderWithProviders(<TestComponent />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })
    
    const logoutButton = screen.getByTestId('logout-button')
    await user.click(logoutButton)
    
    // Should clear token from localStorage
    expect(localStorage.getItem('hospital_auth_token')).toBeNull()
  })

  it('handles authentication errors gracefully', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockRejectedValue(new Error('Authentication failed'))
    
    renderWithProviders(<TestComponent />)
    
    const loginButton = screen.getByTestId('login-button')
    await user.click(loginButton)
    
    // Should handle error without crashing
    expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated')
  })

  it('provides user role information', () => {
    renderWithProviders(<TestComponent />, {
      isAuthenticated: true,
      user: { ...mockUsers.doctor, role: 'doctor' }
    })
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('Dr. John Smith')
  })

  it('handles token refresh', async () => {
    // Mock token refresh scenario
    localStorage.setItem('hospital_refresh_token', 'refresh-token')
    mockFetch({
      access: 'new-access-token'
    })
    
    renderWithProviders(<TestComponent />)
    
    // Should handle token refresh automatically
    expect(localStorage.getItem('hospital_refresh_token')).toBe('refresh-token')
  })
})
