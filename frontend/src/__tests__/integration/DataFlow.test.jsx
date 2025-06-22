/**
 * Data Flow Integration Tests
 * 
 * Tests API integration, state management, and data synchronization
 * Focuses on data consistency across components and real-time updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import { renderWithProviders, mockUsers, mockFetch, userEvent } from '../../test/utils'

// Mock data management component
const MockDataManager = ({ children }) => {
  const [data, setData] = React.useState({
    appointments: [],
    patients: [],
    doctors: [],
    loading: false,
    error: null
  })

  const fetchData = async (endpoint) => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch(`/api/${endpoint}/`)
      const result = await response.json()
      
      setData(prev => ({
        ...prev,
        [endpoint]: result.results || result,
        loading: false
      }))
    } catch (error) {
      setData(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }))
    }
  }

  const updateData = (endpoint, id, updates) => {
    setData(prev => ({
      ...prev,
      [endpoint]: prev[endpoint].map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }))
  }

  const addData = (endpoint, newItem) => {
    setData(prev => ({
      ...prev,
      [endpoint]: [...prev[endpoint], newItem]
    }))
  }

  const removeData = (endpoint, id) => {
    setData(prev => ({
      ...prev,
      [endpoint]: prev[endpoint].filter(item => item.id !== id)
    }))
  }

  return children({ data, fetchData, updateData, addData, removeData })
}

// Mock appointment list component
const MockAppointmentList = ({ appointments, onUpdate, onDelete }) => {
  return (
    <div data-testid="appointment-list">
      {appointments.map(appointment => (
        <div key={appointment.id} data-testid={`appointment-${appointment.id}`}>
          <span data-testid="appointment-patient">{appointment.patient}</span>
          <span data-testid="appointment-status">{appointment.status}</span>
          <button
            data-testid={`update-${appointment.id}`}
            onClick={() => onUpdate(appointment.id, { status: 'confirmed' })}
          >
            Confirm
          </button>
          <button
            data-testid={`delete-${appointment.id}`}
            onClick={() => onDelete(appointment.id)}
          >
            Cancel
          </button>
        </div>
      ))}
    </div>
  )
}

// Mock patient dashboard with real-time updates
const MockPatientDashboard = () => {
  const [notifications, setNotifications] = React.useState([])
  const [lastUpdate, setLastUpdate] = React.useState(null)

  React.useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLastUpdate(new Date().toISOString())
      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          message: 'Appointment reminder',
          timestamp: new Date().toISOString()
        }
      ])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div data-testid="patient-dashboard">
      <div data-testid="last-update">{lastUpdate}</div>
      <div data-testid="notifications">
        {notifications.map(notification => (
          <div key={notification.id} data-testid="notification">
            {notification.message}
          </div>
        ))}
      </div>
    </div>
  )
}

describe('API Data Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and displays appointment data', async () => {
    const mockAppointments = [
      { id: 1, patient: 'John Doe', status: 'scheduled' },
      { id: 2, patient: 'Jane Smith', status: 'confirmed' }
    ]

    mockFetch({ results: mockAppointments })

    renderWithProviders(
      <MockDataManager>
        {({ data, fetchData }) => (
          <div>
            <button
              data-testid="fetch-appointments"
              onClick={() => fetchData('appointments')}
            >
              Load Appointments
            </button>
            <MockAppointmentList
              appointments={data.appointments}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
            {data.loading && <div data-testid="loading">Loading...</div>}
            {data.error && <div data-testid="error">{data.error}</div>}
          </div>
        )}
      </MockDataManager>
    )

    const user = userEvent.setup()

    // Trigger data fetch
    await user.click(screen.getByTestId('fetch-appointments'))

    // Should show loading state
    expect(screen.getByTestId('loading')).toBeInTheDocument()

    // Should display appointments after loading
    await waitFor(() => {
      expect(screen.getByTestId('appointment-1')).toBeInTheDocument()
      expect(screen.getByTestId('appointment-2')).toBeInTheDocument()
    })

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith('/api/appointments/')
  })

  it('handles API errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    renderWithProviders(
      <MockDataManager>
        {({ data, fetchData }) => (
          <div>
            <button
              data-testid="fetch-appointments"
              onClick={() => fetchData('appointments')}
            >
              Load Appointments
            </button>
            {data.loading && <div data-testid="loading">Loading...</div>}
            {data.error && <div data-testid="error">{data.error}</div>}
          </div>
        )}
      </MockDataManager>
    )

    const user = userEvent.setup()

    // Trigger data fetch
    await user.click(screen.getByTestId('fetch-appointments'))

    // Should show error message
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error')
    })

    // Should not show loading state
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
  })

  it('updates appointment status optimistically', async () => {
    const mockAppointments = [
      { id: 1, patient: 'John Doe', status: 'scheduled' }
    ]

    mockFetch({ results: mockAppointments })

    renderWithProviders(
      <MockDataManager>
        {({ data, fetchData, updateData }) => (
          <div>
            <button
              data-testid="fetch-appointments"
              onClick={() => fetchData('appointments')}
            >
              Load Appointments
            </button>
            <MockAppointmentList
              appointments={data.appointments}
              onUpdate={updateData.bind(null, 'appointments')}
              onDelete={() => {}}
            />
          </div>
        )}
      </MockDataManager>
    )

    const user = userEvent.setup()

    // Load appointments
    await user.click(screen.getByTestId('fetch-appointments'))

    await waitFor(() => {
      expect(screen.getByTestId('appointment-1')).toBeInTheDocument()
    })

    // Initial status
    expect(screen.getByTestId('appointment-status')).toHaveTextContent('scheduled')

    // Update appointment status
    await user.click(screen.getByTestId('update-1'))

    // Should update immediately (optimistic update)
    expect(screen.getByTestId('appointment-status')).toHaveTextContent('confirmed')
  })

  it('synchronizes data across multiple components', async () => {
    const mockAppointments = [
      { id: 1, patient: 'John Doe', status: 'scheduled' }
    ]

    mockFetch({ results: mockAppointments })

    renderWithProviders(
      <MockDataManager>
        {({ data, fetchData, updateData, removeData }) => (
          <div>
            <button
              data-testid="fetch-appointments"
              onClick={() => fetchData('appointments')}
            >
              Load Appointments
            </button>
            
            {/* First component */}
            <div data-testid="component-1">
              <MockAppointmentList
                appointments={data.appointments}
                onUpdate={updateData.bind(null, 'appointments')}
                onDelete={removeData.bind(null, 'appointments')}
              />
            </div>
            
            {/* Second component showing same data */}
            <div data-testid="component-2">
              <div data-testid="appointment-count">
                Total: {data.appointments.length}
              </div>
              {data.appointments.map(apt => (
                <div key={apt.id} data-testid={`summary-${apt.id}`}>
                  {apt.patient} - {apt.status}
                </div>
              ))}
            </div>
          </div>
        )}
      </MockDataManager>
    )

    const user = userEvent.setup()

    // Load appointments
    await user.click(screen.getByTestId('fetch-appointments'))

    await waitFor(() => {
      expect(screen.getByTestId('appointment-count')).toHaveTextContent('Total: 1')
      expect(screen.getByTestId('summary-1')).toHaveTextContent('John Doe - scheduled')
    })

    // Update appointment in first component
    await user.click(screen.getByTestId('update-1'))

    // Should update in both components
    expect(screen.getByTestId('summary-1')).toHaveTextContent('John Doe - confirmed')

    // Delete appointment
    await user.click(screen.getByTestId('delete-1'))

    // Should update count in second component
    expect(screen.getByTestId('appointment-count')).toHaveTextContent('Total: 0')
    expect(screen.queryByTestId('summary-1')).not.toBeInTheDocument()
  })
})

describe('Real-time Data Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles real-time notifications', async () => {
    renderWithProviders(<MockPatientDashboard />)

    // Initially no notifications
    expect(screen.queryByTestId('notification')).not.toBeInTheDocument()

    // Advance time to trigger notification
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should show notification
    await waitFor(() => {
      expect(screen.getByTestId('notification')).toBeInTheDocument()
    })

    // Advance time again
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should show multiple notifications
    await waitFor(() => {
      expect(screen.getAllByTestId('notification')).toHaveLength(2)
    })
  })

  it('updates last update timestamp', async () => {
    renderWithProviders(<MockPatientDashboard />)

    // Should show initial timestamp
    expect(screen.getByTestId('last-update')).toBeInTheDocument()

    const initialTime = screen.getByTestId('last-update').textContent

    // Advance time
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should update timestamp
    await waitFor(() => {
      const newTime = screen.getByTestId('last-update').textContent
      expect(newTime).not.toBe(initialTime)
    })
  })
})

describe('State Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('persists form data in localStorage', async () => {
    const MockFormWithPersistence = () => {
      const [formData, setFormData] = React.useState(() => {
        const saved = localStorage.getItem('form-data')
        return saved ? JSON.parse(saved) : { name: '', email: '' }
      })

      React.useEffect(() => {
        localStorage.setItem('form-data', JSON.stringify(formData))
      }, [formData])

      return (
        <form data-testid="persistent-form">
          <input
            data-testid="name-input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Name"
          />
          <input
            data-testid="email-input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email"
          />
        </form>
      )
    }

    const user = userEvent.setup()

    const { unmount } = renderWithProviders(<MockFormWithPersistence />)

    // Fill in form
    await user.type(screen.getByTestId('name-input'), 'John Doe')
    await user.type(screen.getByTestId('email-input'), 'john@example.com')

    // Unmount component
    unmount()

    // Remount component
    renderWithProviders(<MockFormWithPersistence />)

    // Should restore form data
    expect(screen.getByTestId('name-input')).toHaveValue('John Doe')
    expect(screen.getByTestId('email-input')).toHaveValue('john@example.com')

    // Verify localStorage
    const savedData = JSON.parse(localStorage.getItem('form-data'))
    expect(savedData).toEqual({
      name: 'John Doe',
      email: 'john@example.com'
    })
  })

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })

    const MockFormWithErrorHandling = () => {
      const [error, setError] = React.useState(null)

      const saveData = (data) => {
        try {
          localStorage.setItem('form-data', JSON.stringify(data))
        } catch (err) {
          setError(err.message)
        }
      }

      return (
        <div>
          <button
            data-testid="save-button"
            onClick={() => saveData({ test: 'data' })}
          >
            Save
          </button>
          {error && <div data-testid="storage-error">{error}</div>}
        </div>
      )
    }

    const user = userEvent.setup()

    renderWithProviders(<MockFormWithErrorHandling />)

    // Try to save data
    user.click(screen.getByTestId('save-button'))

    // Should show error message
    expect(screen.getByTestId('storage-error')).toHaveTextContent('Storage quota exceeded')

    // Restore original localStorage
    localStorage.setItem = originalSetItem
  })
})
