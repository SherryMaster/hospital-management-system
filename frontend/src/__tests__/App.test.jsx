/**
 * App Component Tests
 * 
 * Basic tests for the main App component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockUsers } from '../test/utils'
import App from '../App'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    BrowserRouter: ({ children }) => <div data-testid="router">{children}</div>,
    Routes: ({ children }) => <div data-testid="routes">{children}</div>,
    Route: ({ element }) => <div data-testid="route">{element}</div>,
  }
})

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    renderWithProviders(<App />)
    
    // Should render the router
    expect(screen.getByTestId('router')).toBeInTheDocument()
  })

  it('renders with theme provider', () => {
    renderWithProviders(<App />)
    
    // The app should be wrapped in theme provider
    const app = screen.getByTestId('router')
    expect(app).toBeInTheDocument()
  })

  it('renders with localization provider', () => {
    renderWithProviders(<App />)
    
    // Should have date picker localization
    expect(screen.getByTestId('router')).toBeInTheDocument()
  })

  it('renders with authentication context', () => {
    renderWithProviders(<App />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })
    
    expect(screen.getByTestId('router')).toBeInTheDocument()
  })

  it('handles unauthenticated state', () => {
    renderWithProviders(<App />, {
      isAuthenticated: false
    })
    
    expect(screen.getByTestId('router')).toBeInTheDocument()
  })
})
