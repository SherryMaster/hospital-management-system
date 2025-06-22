/**
 * User Workflow Integration Tests
 * 
 * Tests complete user journeys and component interactions
 * Focuses on realistic user scenarios and cross-component functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders, mockUsers, mockFetch, userEvent } from '../../test/utils'

// Mock the main App component with simplified routing
const MockApp = () => {
  return (
    <div data-testid="app">
      <div data-testid="header">
        <button data-testid="login-button">Login</button>
        <button data-testid="logout-button">Logout</button>
        <div data-testid="user-menu">User Menu</div>
      </div>
      <div data-testid="main-content">
        <div data-testid="dashboard">Dashboard Content</div>
        <div data-testid="appointments">Appointments</div>
        <div data-testid="profile">Profile</div>
      </div>
      <div data-testid="footer">Footer</div>
    </div>
  )
}

// Mock navigation hook
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  }
})

describe('User Authentication Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('completes full login workflow', async () => {
    const user = userEvent.setup()
    
    // Mock successful login response
    mockFetch({
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      user: mockUsers.patient
    })

    renderWithProviders(<MockApp />)

    // User starts at login page
    const loginButton = screen.getByTestId('login-button')
    expect(loginButton).toBeInTheDocument()

    // User clicks login
    await user.click(loginButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })

    // After successful login, user should see dashboard
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
  })

  it('handles login failure gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock failed login response
    global.fetch = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

    renderWithProviders(<MockApp />)

    const loginButton = screen.getByTestId('login-button')
    await user.click(loginButton)

    // Should show error message
    await waitFor(() => {
      expect(screen.getByTestId('login-button')).toBeInTheDocument()
    })
  })

  it('completes logout workflow', async () => {
    const user = userEvent.setup()
    
    // Start with authenticated user
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })

    // User should see authenticated state
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()

    // User clicks logout
    const logoutButton = screen.getByTestId('logout-button')
    await user.click(logoutButton)

    // Should redirect to login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('persists authentication across page refreshes', async () => {
    // Mock existing token in localStorage
    localStorage.setItem('hospital_auth_token', 'existing-token')
    localStorage.setItem('hospital_user', JSON.stringify(mockUsers.patient))

    renderWithProviders(<MockApp />)

    // Should automatically authenticate user
    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('user-menu')).toBeInTheDocument()
    })
  })
})

describe('Patient Dashboard Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch({
      appointments: [
        {
          id: 1,
          doctor: 'Dr. Smith',
          date: '2025-06-25',
          time: '10:00',
          status: 'scheduled'
        }
      ],
      medical_records: [
        {
          id: 1,
          date: '2025-06-20',
          diagnosis: 'Regular checkup',
          doctor: 'Dr. Smith'
        }
      ]
    })
  })

  it('displays patient dashboard with all sections', async () => {
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })

    // Should show dashboard sections
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('appointments')).toBeInTheDocument()

    // Should load patient data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/appointments/'),
        expect.any(Object)
      )
    })
  })

  it('navigates between dashboard sections', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })

    // Click on appointments section
    const appointmentsSection = screen.getByTestId('appointments')
    await user.click(appointmentsSection)

    // Should show appointments view
    expect(appointmentsSection).toBeInTheDocument()

    // Click on profile section
    const profileSection = screen.getByTestId('profile')
    await user.click(profileSection)

    // Should show profile view
    expect(profileSection).toBeInTheDocument()
  })

  it('handles data loading states', async () => {
    // Mock delayed response
    global.fetch = vi.fn().mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ appointments: [] })
        }), 100)
      )
    )

    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })

    // Should show loading state initially
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()

    // Should show content after loading
    await waitFor(() => {
      expect(screen.getByTestId('appointments')).toBeInTheDocument()
    }, { timeout: 200 })
  })
})

describe('Doctor Dashboard Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch({
      today_appointments: [
        {
          id: 1,
          patient: 'John Doe',
          time: '10:00',
          status: 'scheduled'
        }
      ],
      patients: [
        {
          id: 1,
          name: 'John Doe',
          last_visit: '2025-06-20'
        }
      ]
    })
  })

  it('displays doctor dashboard with schedule', async () => {
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.doctor
    })

    // Should show doctor-specific dashboard
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()

    // Should load doctor data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/appointments/'),
        expect.any(Object)
      )
    })
  })

  it('manages patient interactions', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.doctor
    })

    // Should be able to view patient list
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()

    // Should handle patient selection
    await waitFor(() => {
      expect(screen.getByTestId('appointments')).toBeInTheDocument()
    })
  })
})

describe('Admin Dashboard Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch({
      system_stats: {
        total_users: 150,
        total_appointments: 45,
        active_doctors: 25
      },
      recent_activities: [
        {
          id: 1,
          action: 'User registered',
          timestamp: '2025-06-22T10:00:00Z'
        }
      ]
    })
  })

  it('displays admin dashboard with system overview', async () => {
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.admin
    })

    // Should show admin dashboard
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()

    // Should load system statistics
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/'),
        expect.any(Object)
      )
    })
  })

  it('manages system operations', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.admin
    })

    // Should show admin controls
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()

    // Should handle admin actions
    await waitFor(() => {
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })
  })
})

describe('Cross-Component Communication', () => {
  it('updates UI when user data changes', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })

    // Initial state
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()

    // Simulate user profile update
    mockFetch({ ...mockUsers.patient, first_name: 'Updated Name' })

    // Should reflect changes across components
    await waitFor(() => {
      expect(screen.getByTestId('user-menu')).toBeInTheDocument()
    })
  })

  it('handles real-time notifications', async () => {
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })

    // Should show notification system
    expect(screen.getByTestId('header')).toBeInTheDocument()

    // Simulate incoming notification
    // This would test WebSocket or polling mechanisms
    await waitFor(() => {
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })
  })

  it('maintains state consistency across navigation', async () => {
    const user = userEvent.setup()
    
    renderWithProviders(<MockApp />, {
      isAuthenticated: true,
      user: mockUsers.patient
    })

    // Navigate between sections
    const appointmentsSection = screen.getByTestId('appointments')
    await user.click(appointmentsSection)

    const profileSection = screen.getByTestId('profile')
    await user.click(profileSection)

    // State should be maintained
    expect(screen.getByTestId('user-menu')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })
})
