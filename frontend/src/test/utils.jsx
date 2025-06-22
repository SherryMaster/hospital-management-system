/**
 * Test Utilities for Hospital Management System Frontend
 * 
 * Provides reusable testing utilities and mock providers
 */

import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { vi } from 'vitest'

import { theme } from '../theme'
import { AuthProvider } from '../contexts/AuthContext'

// Mock user data
export const mockUsers = {
  admin: {
    id: 1,
    username: 'admin',
    email: 'admin@hospital.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    is_active: true,
    is_verified: true,
  },
  doctor: {
    id: 2,
    username: 'doctor1',
    email: 'doctor@hospital.com',
    first_name: 'Dr. John',
    last_name: 'Smith',
    role: 'doctor',
    is_active: true,
    is_verified: true,
  },
  patient: {
    id: 3,
    username: 'patient1',
    email: 'patient@hospital.com',
    first_name: 'Jane',
    last_name: 'Doe',
    role: 'patient',
    is_active: true,
    is_verified: true,
  },
}

// Mock appointments
export const mockAppointments = [
  {
    id: 1,
    patient: mockUsers.patient,
    doctor: mockUsers.doctor,
    appointment_date: '2025-06-25',
    appointment_time: '10:00:00',
    appointment_type: 'consultation',
    status: 'scheduled',
    chief_complaint: 'Regular checkup',
  },
  {
    id: 2,
    patient: mockUsers.patient,
    doctor: mockUsers.doctor,
    appointment_date: '2025-06-26',
    appointment_time: '14:00:00',
    appointment_type: 'follow_up',
    status: 'confirmed',
    chief_complaint: 'Follow-up visit',
  },
]

// Mock departments
export const mockDepartments = [
  {
    id: 1,
    name: 'Cardiology',
    description: 'Heart and cardiovascular care',
    is_active: true,
  },
  {
    id: 2,
    name: 'Neurology',
    description: 'Brain and nervous system care',
    is_active: true,
  },
]

// Mock doctors
export const mockDoctors = [
  {
    id: 1,
    user: mockUsers.doctor,
    doctor_id: 'DR001',
    department: mockDepartments[0],
    consultation_fee: '200.00',
    is_accepting_patients: true,
  },
]

// Mock patients
export const mockPatients = [
  {
    id: 1,
    user: mockUsers.patient,
    patient_id: 'P001',
    blood_type: 'O+',
    emergency_contact: 'John Doe - +1234567890',
  },
]

// Mock API responses
export const mockApiResponses = {
  login: {
    access: 'mock-access-token',
    refresh: 'mock-refresh-token',
    user: mockUsers.patient,
  },
  appointments: {
    results: mockAppointments,
    count: mockAppointments.length,
  },
  doctors: {
    results: mockDoctors,
    count: mockDoctors.length,
  },
  patients: {
    results: mockPatients,
    count: mockPatients.length,
  },
}

// Mock Auth Context
export const MockAuthProvider = ({ children, user = null, isAuthenticated = false }) => {
  const mockAuthValue = {
    user,
    isAuthenticated,
    isLoading: false,
    login: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn(),
    register: vi.fn().mockResolvedValue({ success: true }),
    updateProfile: vi.fn().mockResolvedValue({ success: true }),
  }

  return (
    <AuthProvider value={mockAuthValue}>
      {children}
    </AuthProvider>
  )
}

// Custom render function with all providers
export const renderWithProviders = (
  ui,
  {
    user = null,
    isAuthenticated = false,
    initialEntries = ['/'],
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MockAuthProvider user={user} isAuthenticated={isAuthenticated}>
            {children}
          </MockAuthProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </BrowserRouter>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Custom render for components that need routing
export const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route)
  return renderWithProviders(ui)
}

// Mock fetch responses
export const mockFetch = (response, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(response),
    text: vi.fn().mockResolvedValue(JSON.stringify(response)),
  })
}

// Mock fetch error
export const mockFetchError = (error = 'Network error') => {
  global.fetch = vi.fn().mockRejectedValue(new Error(error))
}

// Wait for async operations
export const waitFor = (callback, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 1000
    const interval = options.interval || 50
    const startTime = Date.now()

    const check = () => {
      try {
        const result = callback()
        if (result) {
          resolve(result)
        } else if (Date.now() - startTime >= timeout) {
          reject(new Error('Timeout waiting for condition'))
        } else {
          setTimeout(check, interval)
        }
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(error)
        } else {
          setTimeout(check, interval)
        }
      }
    }

    check()
  })
}

// Create mock component for testing
export const createMockComponent = (name, props = {}) => {
  const MockComponent = (componentProps) => (
    <div data-testid={`mock-${name.toLowerCase()}`} {...props} {...componentProps}>
      Mock {name}
    </div>
  )
  MockComponent.displayName = `Mock${name}`
  return MockComponent
}

// Mock Material-UI components that might cause issues in tests
export const mockMuiComponents = () => {
  vi.mock('@mui/material/Autocomplete', () => ({
    default: createMockComponent('Autocomplete'),
  }))

  vi.mock('@mui/x-date-pickers/DatePicker', () => ({
    DatePicker: createMockComponent('DatePicker'),
  }))

  vi.mock('@mui/x-date-pickers/TimePicker', () => ({
    TimePicker: createMockComponent('TimePicker'),
  }))
}

// Test data generators
export const generateMockUser = (overrides = {}) => ({
  ...mockUsers.patient,
  id: Math.floor(Math.random() * 1000),
  email: `user${Math.floor(Math.random() * 1000)}@test.com`,
  ...overrides,
})

export const generateMockAppointment = (overrides = {}) => ({
  ...mockAppointments[0],
  id: Math.floor(Math.random() * 1000),
  appointment_date: new Date().toISOString().split('T')[0],
  ...overrides,
})

// Re-export testing library utilities
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
