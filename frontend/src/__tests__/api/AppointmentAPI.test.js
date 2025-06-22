/**
 * Appointment API Integration Tests
 * 
 * Tests appointment booking, management, and scheduling API integration
 * Validates data flow between frontend and backend for appointment operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { appointmentAPI } from '../../services/api'

// Mock fetch for controlled testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Appointment API Integration', () => {
  const mockToken = 'valid-access-token'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Appointment Listing', () => {
    it('should fetch appointments successfully', async () => {
      const mockResponse = {
        count: 2,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            patient: {
              id: 1,
              user: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com'
              }
            },
            doctor: {
              id: 1,
              user: {
                first_name: 'Dr. Jane',
                last_name: 'Smith',
                email: 'jane@hospital.com'
              }
            },
            appointment_date: '2025-06-25',
            appointment_time: '10:00:00',
            status: 'scheduled',
            appointment_type: 'consultation',
            chief_complaint: 'Regular checkup'
          },
          {
            id: 2,
            patient: {
              id: 1,
              user: {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com'
              }
            },
            doctor: {
              id: 2,
              user: {
                first_name: 'Dr. Bob',
                last_name: 'Johnson',
                email: 'bob@hospital.com'
              }
            },
            appointment_date: '2025-06-26',
            appointment_time: '14:00:00',
            status: 'confirmed',
            appointment_type: 'follow_up',
            chief_complaint: 'Follow-up visit'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const result = await appointmentAPI.getAppointments(mockToken)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          })
        })
      )

      expect(result).toEqual(mockResponse)
      expect(result.results).toHaveLength(2)
    })

    it('should handle pagination parameters', async () => {
      const mockResponse = {
        count: 50,
        next: 'http://localhost:8000/api/appointments/?page=2',
        previous: null,
        results: []
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const params = { page: 1, page_size: 10 }
      await appointmentAPI.getAppointments(mockToken, params)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/?page=1&page_size=10'),
        expect.any(Object)
      )
    })

    it('should handle filtering parameters', async () => {
      const mockResponse = {
        count: 1,
        results: []
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const filters = {
        status: 'scheduled',
        appointment_date: '2025-06-25',
        doctor: 1
      }

      await appointmentAPI.getAppointments(mockToken, filters)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=scheduled'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('appointment_date=2025-06-25'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('doctor=1'),
        expect.any(Object)
      )
    })
  })

  describe('Appointment Creation', () => {
    it('should create appointment successfully', async () => {
      const mockResponse = {
        id: 3,
        patient: 1,
        doctor: 1,
        appointment_date: '2025-06-27',
        appointment_time: '09:00:00',
        status: 'scheduled',
        appointment_type: 'consultation',
        chief_complaint: 'Chest pain',
        created_at: '2025-06-22T10:00:00Z'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const appointmentData = {
        doctor: 1,
        appointment_date: '2025-06-27',
        appointment_time: '09:00:00',
        appointment_type: 'consultation',
        chief_complaint: 'Chest pain'
      }

      const result = await appointmentAPI.createAppointment(mockToken, appointmentData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(appointmentData)
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle appointment validation errors', async () => {
      const mockErrorResponse = {
        appointment_date: ['Cannot book appointments in the past'],
        appointment_time: ['This time slot is not available'],
        doctor: ['Doctor is not available at this time']
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const invalidAppointmentData = {
        doctor: 1,
        appointment_date: '2025-06-20', // Past date
        appointment_time: '25:00:00', // Invalid time
        appointment_type: 'consultation'
      }

      await expect(
        appointmentAPI.createAppointment(mockToken, invalidAppointmentData)
      ).rejects.toThrow()
    })

    it('should handle appointment conflicts', async () => {
      const mockErrorResponse = {
        non_field_errors: ['An appointment already exists for this time slot']
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const conflictingAppointmentData = {
        doctor: 1,
        appointment_date: '2025-06-25',
        appointment_time: '10:00:00',
        appointment_type: 'consultation'
      }

      await expect(
        appointmentAPI.createAppointment(mockToken, conflictingAppointmentData)
      ).rejects.toThrow()
    })
  })

  describe('Appointment Updates', () => {
    it('should update appointment successfully', async () => {
      const mockResponse = {
        id: 1,
        patient: 1,
        doctor: 1,
        appointment_date: '2025-06-25',
        appointment_time: '10:00:00',
        status: 'confirmed',
        appointment_type: 'consultation',
        chief_complaint: 'Regular checkup - updated',
        notes: 'Patient confirmed attendance'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const updateData = {
        status: 'confirmed',
        chief_complaint: 'Regular checkup - updated',
        notes: 'Patient confirmed attendance'
      }

      const result = await appointmentAPI.updateAppointment(mockToken, 1, updateData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/1/'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(updateData)
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle appointment not found', async () => {
      const mockErrorResponse = {
        detail: 'Not found.'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const updateData = { status: 'confirmed' }

      await expect(
        appointmentAPI.updateAppointment(mockToken, 999, updateData)
      ).rejects.toThrow()
    })

    it('should handle unauthorized appointment update', async () => {
      const mockErrorResponse = {
        detail: 'You do not have permission to perform this action.'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const updateData = { status: 'confirmed' }

      await expect(
        appointmentAPI.updateAppointment(mockToken, 1, updateData)
      ).rejects.toThrow()
    })
  })

  describe('Appointment Cancellation', () => {
    it('should cancel appointment successfully', async () => {
      const mockResponse = {
        id: 1,
        status: 'cancelled',
        cancelled_at: '2025-06-22T10:00:00Z',
        cancellation_reason: 'Patient request'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const cancellationData = {
        cancellation_reason: 'Patient request'
      }

      const result = await appointmentAPI.cancelAppointment(mockToken, 1, cancellationData)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/1/cancel/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(cancellationData)
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle cancellation of already cancelled appointment', async () => {
      const mockErrorResponse = {
        detail: 'Appointment is already cancelled'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      await expect(
        appointmentAPI.cancelAppointment(mockToken, 1, {})
      ).rejects.toThrow()
    })
  })

  describe('Doctor Availability', () => {
    it('should fetch doctor availability successfully', async () => {
      const mockResponse = {
        doctor_id: 1,
        date: '2025-06-25',
        available_slots: [
          { time: '09:00:00', available: true },
          { time: '10:00:00', available: false },
          { time: '11:00:00', available: true },
          { time: '14:00:00', available: true },
          { time: '15:00:00', available: true }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const result = await appointmentAPI.getDoctorAvailability(mockToken, 1, '2025-06-25')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/doctors/1/availability/?date=2025-06-25'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          })
        })
      )

      expect(result).toEqual(mockResponse)
      expect(result.available_slots).toHaveLength(5)
    })

    it('should handle invalid date format', async () => {
      const mockErrorResponse = {
        date: ['Enter a valid date.']
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      await expect(
        appointmentAPI.getDoctorAvailability(mockToken, 1, 'invalid-date')
      ).rejects.toThrow()
    })
  })

  describe('Appointment Statistics', () => {
    it('should fetch appointment statistics successfully', async () => {
      const mockResponse = {
        total_appointments: 25,
        scheduled_appointments: 10,
        confirmed_appointments: 8,
        completed_appointments: 5,
        cancelled_appointments: 2,
        upcoming_appointments: 18,
        past_appointments: 7
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const result = await appointmentAPI.getAppointmentStats(mockToken)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/appointments/stats/'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          })
        })
      )

      expect(result).toEqual(mockResponse)
    })

    it('should handle date range filters for statistics', async () => {
      const mockResponse = {
        total_appointments: 5,
        date_range: {
          start_date: '2025-06-01',
          end_date: '2025-06-30'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      })

      const dateRange = {
        start_date: '2025-06-01',
        end_date: '2025-06-30'
      }

      await appointmentAPI.getAppointmentStats(mockToken, dateRange)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2025-06-01'),
        expect.any(Object)
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('end_date=2025-06-30'),
        expect.any(Object)
      )
    })
  })
})
