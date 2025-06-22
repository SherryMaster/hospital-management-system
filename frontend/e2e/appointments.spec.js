/**
 * Appointment Booking E2E Tests
 * 
 * Tests complete appointment booking workflows from patient and doctor perspectives
 */

import { test, expect } from '@playwright/test'

// Helper function to login
async function loginAs(page, email, password) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/.*dashboard/)
}

test.describe('Appointment Booking Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as patient for appointment booking tests
    await loginAs(page, 'patient@test.com', 'TestPass123!')
  })

  test('should complete full appointment booking process', async ({ page }) => {
    // Navigate to appointment booking
    await page.click('text=Book Appointment')
    await expect(page).toHaveURL(/.*appointments\/book/)

    // Step 1: Select Department
    await expect(page.locator('text=Select Department')).toBeVisible()
    await page.click('[data-testid="department-cardiology"]')

    // Step 2: Select Doctor
    await expect(page.locator('text=Select Doctor')).toBeVisible()
    await page.click('[data-testid="doctor-card"]')

    // Step 3: Select Date and Time
    await expect(page.locator('text=Select Date & Time')).toBeVisible()
    
    // Select a future date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[type="date"]', dateString)
    
    // Select available time slot
    await page.click('[data-testid="time-slot-10:00"]')

    // Step 4: Add Details and Confirm
    await expect(page.locator('text=Appointment Details')).toBeVisible()
    await page.fill('textarea[placeholder*="chief complaint"]', 'Regular checkup and consultation')
    
    // Verify appointment summary
    await expect(page.locator('text=Cardiology')).toBeVisible()
    await expect(page.locator('text=10:00')).toBeVisible()
    
    // Confirm booking
    await page.click('button:has-text("Book Appointment")')
    
    // Should show success message
    await expect(page.locator('text=Appointment booked successfully')).toBeVisible()
    
    // Should redirect to appointments list
    await expect(page).toHaveURL(/.*appointments/)
    
    // Should show the new appointment
    await expect(page.locator('text=Regular checkup and consultation')).toBeVisible()
  })

  test('should show available time slots correctly', async ({ page }) => {
    await page.click('text=Book Appointment')
    
    // Select department and doctor
    await page.click('[data-testid="department-cardiology"]')
    await page.click('[data-testid="doctor-card"]')
    
    // Select date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateString)
    
    // Should show available time slots
    await expect(page.locator('[data-testid="time-slot-09:00"]')).toBeVisible()
    await expect(page.locator('[data-testid="time-slot-10:00"]')).toBeVisible()
    await expect(page.locator('[data-testid="time-slot-11:00"]')).toBeVisible()
    
    // Should disable unavailable slots
    await expect(page.locator('[data-testid="time-slot-unavailable"]')).toBeDisabled()
  })

  test('should validate appointment booking form', async ({ page }) => {
    await page.click('text=Book Appointment')
    
    // Try to proceed without selecting department
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Please select a department')).toBeVisible()
    
    // Select department but not doctor
    await page.click('[data-testid="department-cardiology"]')
    await page.click('button:has-text("Next")')
    await expect(page.locator('text=Please select a doctor')).toBeVisible()
  })

  test('should allow going back through booking steps', async ({ page }) => {
    await page.click('text=Book Appointment')
    
    // Go through steps
    await page.click('[data-testid="department-cardiology"]')
    await page.click('[data-testid="doctor-card"]')
    
    // Go back to doctor selection
    await page.click('button:has-text("Back")')
    await expect(page.locator('text=Select Doctor')).toBeVisible()
    
    // Go back to department selection
    await page.click('button:has-text("Back")')
    await expect(page.locator('text=Select Department')).toBeVisible()
  })

  test('should handle booking conflicts', async ({ page }) => {
    await page.click('text=Book Appointment')
    
    // Complete booking process
    await page.click('[data-testid="department-cardiology"]')
    await page.click('[data-testid="doctor-card"]')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateString)
    
    // Try to book an already taken slot
    await page.click('[data-testid="time-slot-taken"]')
    
    // Should show conflict message
    await expect(page.locator('text=This time slot is no longer available')).toBeVisible()
  })
})

test.describe('Appointment Management - Patient View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
  })

  test('should display patient appointments', async ({ page }) => {
    await page.click('text=My Appointments')
    await expect(page).toHaveURL(/.*appointments/)
    
    // Should show appointments list
    await expect(page.locator('[data-testid="appointments-list"]')).toBeVisible()
    
    // Should show appointment cards with details
    await expect(page.locator('[data-testid="appointment-card"]')).toBeVisible()
    
    // Should show appointment status
    await expect(page.locator('text=Scheduled')).toBeVisible()
  })

  test('should allow canceling appointments', async ({ page }) => {
    await page.click('text=My Appointments')
    
    // Click cancel on an appointment
    await page.click('[data-testid="cancel-appointment-btn"]')
    
    // Should show confirmation dialog
    await expect(page.locator('text=Cancel Appointment')).toBeVisible()
    await expect(page.locator('text=Are you sure you want to cancel this appointment?')).toBeVisible()
    
    // Confirm cancellation
    await page.click('button:has-text("Yes, Cancel")')
    
    // Should show success message
    await expect(page.locator('text=Appointment cancelled successfully')).toBeVisible()
    
    // Appointment status should update
    await expect(page.locator('text=Cancelled')).toBeVisible()
  })

  test('should allow rescheduling appointments', async ({ page }) => {
    await page.click('text=My Appointments')
    
    // Click reschedule
    await page.click('[data-testid="reschedule-appointment-btn"]')
    
    // Should open reschedule dialog
    await expect(page.locator('text=Reschedule Appointment')).toBeVisible()
    
    // Select new date and time
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const dateString = nextWeek.toISOString().split('T')[0]
    
    await page.fill('input[type="date"]', dateString)
    await page.click('[data-testid="time-slot-14:00"]')
    
    // Confirm reschedule
    await page.click('button:has-text("Reschedule")')
    
    // Should show success message
    await expect(page.locator('text=Appointment rescheduled successfully')).toBeVisible()
  })

  test('should show appointment details', async ({ page }) => {
    await page.click('text=My Appointments')
    
    // Click on appointment to view details
    await page.click('[data-testid="appointment-card"]')
    
    // Should show appointment details modal/page
    await expect(page.locator('text=Appointment Details')).toBeVisible()
    await expect(page.locator('text=Doctor:')).toBeVisible()
    await expect(page.locator('text=Date:')).toBeVisible()
    await expect(page.locator('text=Time:')).toBeVisible()
    await expect(page.locator('text=Department:')).toBeVisible()
    await expect(page.locator('text=Chief Complaint:')).toBeVisible()
  })
})

test.describe('Appointment Management - Doctor View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'doctor@test.com', 'TestPass123!')
  })

  test('should display doctor schedule', async ({ page }) => {
    // Should be on doctor dashboard
    await expect(page.locator('text=Today\'s Schedule')).toBeVisible()
    
    // Should show today's appointments
    await expect(page.locator('[data-testid="todays-appointments"]')).toBeVisible()
    
    // Should show appointment time slots
    await expect(page.locator('[data-testid="appointment-slot"]')).toBeVisible()
  })

  test('should allow updating appointment status', async ({ page }) => {
    // Click on an appointment
    await page.click('[data-testid="appointment-slot"]')
    
    // Should show appointment actions
    await expect(page.locator('text=Update Status')).toBeVisible()
    
    // Update to confirmed
    await page.selectOption('select[name="status"]', 'confirmed')
    await page.click('button:has-text("Update")')
    
    // Should show success message
    await expect(page.locator('text=Appointment status updated')).toBeVisible()
  })

  test('should allow adding notes to appointments', async ({ page }) => {
    await page.click('[data-testid="appointment-slot"]')
    
    // Add doctor notes
    await page.fill('textarea[placeholder*="notes"]', 'Patient arrived on time. Vital signs normal.')
    await page.click('button:has-text("Save Notes")')
    
    // Should show success message
    await expect(page.locator('text=Notes saved successfully')).toBeVisible()
  })

  test('should show patient information', async ({ page }) => {
    await page.click('[data-testid="appointment-slot"]')
    
    // Should show patient details
    await expect(page.locator('text=Patient Information')).toBeVisible()
    await expect(page.locator('text=Medical History')).toBeVisible()
    await expect(page.locator('text=Allergies')).toBeVisible()
    await expect(page.locator('text=Previous Visits')).toBeVisible()
  })

  test('should allow managing availability', async ({ page }) => {
    await page.click('text=Manage Availability')
    
    // Should show availability calendar
    await expect(page.locator('[data-testid="availability-calendar"]')).toBeVisible()
    
    // Should allow setting unavailable times
    await page.click('[data-testid="time-slot-15:00"]')
    await page.click('button:has-text("Mark Unavailable")')
    
    // Should show confirmation
    await expect(page.locator('text=Availability updated')).toBeVisible()
  })
})
