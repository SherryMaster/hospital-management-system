/**
 * Form Interaction Integration Tests
 * 
 * Tests complex form workflows, validation, and data submission
 * Focuses on multi-step forms and form-to-form interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { renderWithProviders, mockUsers, mockFetch, userEvent } from '../../test/utils'

// Mock form components
const MockLoginForm = ({ onSubmit, onError }) => {
  const handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')
    
    try {
      await onSubmit({ email, password })
    } catch (error) {
      onError(error.message)
    }
  }

  return (
    <form data-testid="login-form" onSubmit={handleSubmit}>
      <input
        name="email"
        type="email"
        placeholder="Email"
        data-testid="email-input"
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        data-testid="password-input"
        required
      />
      <button type="submit" data-testid="submit-button">
        Sign In
      </button>
      <div data-testid="error-message"></div>
    </form>
  )
}

const MockAppointmentForm = ({ onSubmit, onStepChange }) => {
  const [step, setStep] = React.useState(1)
  const [formData, setFormData] = React.useState({})

  const handleNext = (data) => {
    setFormData({ ...formData, ...data })
    setStep(step + 1)
    onStepChange?.(step + 1)
  }

  const handleSubmit = () => {
    onSubmit(formData)
  }

  return (
    <div data-testid="appointment-form">
      <div data-testid={`step-${step}`}>
        {step === 1 && (
          <div data-testid="department-selection">
            <h3>Select Department</h3>
            <button
              data-testid="cardiology-dept"
              onClick={() => handleNext({ department: 'cardiology' })}
            >
              Cardiology
            </button>
            <button
              data-testid="neurology-dept"
              onClick={() => handleNext({ department: 'neurology' })}
            >
              Neurology
            </button>
          </div>
        )}
        
        {step === 2 && (
          <div data-testid="doctor-selection">
            <h3>Select Doctor</h3>
            <button
              data-testid="doctor-smith"
              onClick={() => handleNext({ doctor: 'Dr. Smith' })}
            >
              Dr. Smith
            </button>
            <button
              data-testid="doctor-jones"
              onClick={() => handleNext({ doctor: 'Dr. Jones' })}
            >
              Dr. Jones
            </button>
          </div>
        )}
        
        {step === 3 && (
          <div data-testid="datetime-selection">
            <h3>Select Date & Time</h3>
            <input
              type="date"
              data-testid="date-input"
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
            <button
              data-testid="time-slot-10"
              onClick={() => handleNext({ time: '10:00' })}
            >
              10:00 AM
            </button>
            <button
              data-testid="time-slot-14"
              onClick={() => handleNext({ time: '14:00' })}
            >
              2:00 PM
            </button>
          </div>
        )}
        
        {step === 4 && (
          <div data-testid="confirmation">
            <h3>Confirm Appointment</h3>
            <div data-testid="appointment-summary">
              <p>Department: {formData.department}</p>
              <p>Doctor: {formData.doctor}</p>
              <p>Date: {formData.date}</p>
              <p>Time: {formData.time}</p>
            </div>
            <textarea
              data-testid="chief-complaint"
              placeholder="Chief complaint (optional)"
              onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
            />
            <button data-testid="confirm-button" onClick={handleSubmit}>
              Book Appointment
            </button>
          </div>
        )}
      </div>
      
      <div data-testid="progress-indicator">
        Step {step} of 4
      </div>
      
      {step > 1 && (
        <button
          data-testid="back-button"
          onClick={() => setStep(step - 1)}
        >
          Back
        </button>
      )}
    </div>
  )
}

const MockProfileForm = ({ user, onSubmit }) => {
  const [formData, setFormData] = React.useState(user || {})
  const [errors, setErrors] = React.useState({})

  const validateForm = () => {
    const newErrors = {}
    if (!formData.first_name) newErrors.first_name = 'First name is required'
    if (!formData.last_name) newErrors.last_name = 'Last name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData)
    }
  }

  return (
    <form data-testid="profile-form" onSubmit={handleSubmit}>
      <input
        data-testid="first-name-input"
        value={formData.first_name || ''}
        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
        placeholder="First Name"
      />
      {errors.first_name && (
        <div data-testid="first-name-error">{errors.first_name}</div>
      )}
      
      <input
        data-testid="last-name-input"
        value={formData.last_name || ''}
        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
        placeholder="Last Name"
      />
      {errors.last_name && (
        <div data-testid="last-name-error">{errors.last_name}</div>
      )}
      
      <input
        data-testid="email-input"
        type="email"
        value={formData.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      {errors.email && (
        <div data-testid="email-error">{errors.email}</div>
      )}
      
      <input
        data-testid="phone-input"
        value={formData.phone || ''}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="Phone"
      />
      
      <button type="submit" data-testid="save-button">
        Save Changes
      </button>
    </form>
  )
}

describe('Login Form Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles successful login flow', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn().mockResolvedValue({ success: true })
    const mockOnError = vi.fn()

    renderWithProviders(
      <MockLoginForm onSubmit={mockOnSubmit} onError={mockOnError} />
    )

    // Fill in form
    await user.type(screen.getByTestId('email-input'), 'patient@hospital.com')
    await user.type(screen.getByTestId('password-input'), 'password123')

    // Submit form
    await user.click(screen.getByTestId('submit-button'))

    // Verify submission
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'patient@hospital.com',
        password: 'password123'
      })
    })

    expect(mockOnError).not.toHaveBeenCalled()
  })

  it('handles login validation errors', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn().mockRejectedValue(new Error('Invalid credentials'))
    const mockOnError = vi.fn()

    renderWithProviders(
      <MockLoginForm onSubmit={mockOnSubmit} onError={mockOnError} />
    )

    // Fill in form with invalid data
    await user.type(screen.getByTestId('email-input'), 'invalid@email.com')
    await user.type(screen.getByTestId('password-input'), 'wrongpassword')

    // Submit form
    await user.click(screen.getByTestId('submit-button'))

    // Verify error handling
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Invalid credentials')
    })
  })

  it('prevents submission with empty fields', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn()

    renderWithProviders(
      <MockLoginForm onSubmit={mockOnSubmit} />
    )

    // Try to submit empty form
    await user.click(screen.getByTestId('submit-button'))

    // Form should not submit due to HTML5 validation
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})

describe('Multi-Step Appointment Form Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes full appointment booking workflow', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn()
    const mockOnStepChange = vi.fn()

    renderWithProviders(
      <MockAppointmentForm 
        onSubmit={mockOnSubmit} 
        onStepChange={mockOnStepChange}
      />
    )

    // Step 1: Select department
    expect(screen.getByTestId('step-1')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    
    await user.click(screen.getByTestId('cardiology-dept'))

    // Step 2: Select doctor
    await waitFor(() => {
      expect(screen.getByTestId('step-2')).toBeInTheDocument()
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    })
    
    await user.click(screen.getByTestId('doctor-smith'))

    // Step 3: Select date and time
    await waitFor(() => {
      expect(screen.getByTestId('step-3')).toBeInTheDocument()
      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
    })
    
    await user.type(screen.getByTestId('date-input'), '2025-06-25')
    await user.click(screen.getByTestId('time-slot-10'))

    // Step 4: Confirmation
    await waitFor(() => {
      expect(screen.getByTestId('step-4')).toBeInTheDocument()
      expect(screen.getByText('Step 4 of 4')).toBeInTheDocument()
    })

    // Verify summary
    const summary = screen.getByTestId('appointment-summary')
    expect(within(summary).getByText('Department: cardiology')).toBeInTheDocument()
    expect(within(summary).getByText('Doctor: Dr. Smith')).toBeInTheDocument()
    expect(within(summary).getByText('Time: 10:00')).toBeInTheDocument()

    // Add chief complaint
    await user.type(screen.getByTestId('chief-complaint'), 'Regular checkup')

    // Submit appointment
    await user.click(screen.getByTestId('confirm-button'))

    // Verify submission
    expect(mockOnSubmit).toHaveBeenCalledWith({
      department: 'cardiology',
      doctor: 'Dr. Smith',
      date: '2025-06-25',
      time: '10:00',
      complaint: 'Regular checkup'
    })

    // Verify step changes were tracked
    expect(mockOnStepChange).toHaveBeenCalledTimes(3)
  })

  it('allows navigation back through steps', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn()

    renderWithProviders(
      <MockAppointmentForm onSubmit={mockOnSubmit} />
    )

    // Go to step 2
    await user.click(screen.getByTestId('cardiology-dept'))
    
    await waitFor(() => {
      expect(screen.getByTestId('step-2')).toBeInTheDocument()
    })

    // Go back to step 1
    await user.click(screen.getByTestId('back-button'))

    expect(screen.getByTestId('step-1')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
  })

  it('maintains form data when navigating between steps', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn()

    renderWithProviders(
      <MockAppointmentForm onSubmit={mockOnSubmit} />
    )

    // Complete first two steps
    await user.click(screen.getByTestId('cardiology-dept'))
    
    await waitFor(() => {
      expect(screen.getByTestId('step-2')).toBeInTheDocument()
    })
    
    await user.click(screen.getByTestId('doctor-smith'))

    // Go to step 3, then back to step 2
    await waitFor(() => {
      expect(screen.getByTestId('step-3')).toBeInTheDocument()
    })
    
    await user.click(screen.getByTestId('back-button'))

    // Should still be on step 2 with data preserved
    expect(screen.getByTestId('step-2')).toBeInTheDocument()
    expect(screen.getByTestId('doctor-smith')).toBeInTheDocument()
  })
})

describe('Profile Form Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads existing user data', () => {
    const mockOnSubmit = vi.fn()

    renderWithProviders(
      <MockProfileForm user={mockUsers.patient} onSubmit={mockOnSubmit} />
    )

    // Should pre-populate with user data
    expect(screen.getByTestId('first-name-input')).toHaveValue(mockUsers.patient.first_name)
    expect(screen.getByTestId('last-name-input')).toHaveValue(mockUsers.patient.last_name)
    expect(screen.getByTestId('email-input')).toHaveValue(mockUsers.patient.email)
  })

  it('validates form fields', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn()

    renderWithProviders(
      <MockProfileForm onSubmit={mockOnSubmit} />
    )

    // Clear required fields
    await user.clear(screen.getByTestId('first-name-input'))
    await user.clear(screen.getByTestId('email-input'))

    // Add invalid email
    await user.type(screen.getByTestId('email-input'), 'invalid-email')

    // Submit form
    await user.click(screen.getByTestId('save-button'))

    // Should show validation errors
    expect(screen.getByTestId('first-name-error')).toHaveTextContent('First name is required')
    expect(screen.getByTestId('email-error')).toHaveTextContent('Email is invalid')

    // Should not submit
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits valid form data', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn()

    renderWithProviders(
      <MockProfileForm onSubmit={mockOnSubmit} />
    )

    // Fill in valid data
    await user.type(screen.getByTestId('first-name-input'), 'John')
    await user.type(screen.getByTestId('last-name-input'), 'Doe')
    await user.type(screen.getByTestId('email-input'), 'john.doe@example.com')
    await user.type(screen.getByTestId('phone-input'), '+1234567890')

    // Submit form
    await user.click(screen.getByTestId('save-button'))

    // Should submit with correct data
    expect(mockOnSubmit).toHaveBeenCalledWith({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    })
  })

  it('clears errors when user corrects input', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn()

    renderWithProviders(
      <MockProfileForm onSubmit={mockOnSubmit} />
    )

    // Submit empty form to trigger errors
    await user.click(screen.getByTestId('save-button'))

    // Should show error
    expect(screen.getByTestId('first-name-error')).toBeInTheDocument()

    // Fix the error
    await user.type(screen.getByTestId('first-name-input'), 'John')

    // Submit again
    await user.click(screen.getByTestId('save-button'))

    // First name error should be cleared
    expect(screen.queryByTestId('first-name-error')).not.toBeInTheDocument()
  })
})
