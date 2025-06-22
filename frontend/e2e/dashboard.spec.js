/**
 * Dashboard and Navigation E2E Tests
 * 
 * Tests dashboard functionality and navigation across different user roles
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

test.describe('Patient Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
  })

  test('should display patient dashboard overview', async ({ page }) => {
    // Should show welcome message
    await expect(page.locator('text=Welcome back, Test Patient')).toBeVisible()
    
    // Should show quick stats
    await expect(page.locator('[data-testid="upcoming-appointments-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-appointments-count"]')).toBeVisible()
    
    // Should show quick action buttons
    await expect(page.locator('button:has-text("Book Appointment")')).toBeVisible()
    await expect(page.locator('button:has-text("View Medical Records")')).toBeVisible()
    await expect(page.locator('button:has-text("Update Profile")')).toBeVisible()
  })

  test('should display upcoming appointments widget', async ({ page }) => {
    // Should show upcoming appointments section
    await expect(page.locator('text=Upcoming Appointments')).toBeVisible()
    
    // Should show appointment cards or empty state
    const appointmentCards = page.locator('[data-testid="appointment-card"]')
    const emptyState = page.locator('text=No upcoming appointments')
    
    await expect(appointmentCards.or(emptyState)).toBeVisible()
  })

  test('should navigate to appointments from dashboard', async ({ page }) => {
    await page.click('button:has-text("View All Appointments")')
    await expect(page).toHaveURL(/.*appointments/)
    
    // Should show appointments page
    await expect(page.locator('text=My Appointments')).toBeVisible()
  })

  test('should navigate to medical records from dashboard', async ({ page }) => {
    await page.click('button:has-text("View Medical Records")')
    await expect(page).toHaveURL(/.*medical-records/)
    
    // Should show medical records page
    await expect(page.locator('text=Medical Records')).toBeVisible()
  })

  test('should show recent medical records widget', async ({ page }) => {
    // Should show recent records section
    await expect(page.locator('text=Recent Medical Records')).toBeVisible()
    
    // Should show records or empty state
    const recordCards = page.locator('[data-testid="medical-record-card"]')
    const emptyState = page.locator('text=No medical records found')
    
    await expect(recordCards.or(emptyState)).toBeVisible()
  })
})

test.describe('Doctor Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'doctor@test.com', 'TestPass123!')
  })

  test('should display doctor dashboard overview', async ({ page }) => {
    // Should show welcome message
    await expect(page.locator('text=Welcome back, Dr. Test Doctor')).toBeVisible()
    
    // Should show today's schedule
    await expect(page.locator('text=Today\'s Schedule')).toBeVisible()
    
    // Should show patient statistics
    await expect(page.locator('[data-testid="todays-patients-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-patients-count"]')).toBeVisible()
    
    // Should show quick actions
    await expect(page.locator('button:has-text("View All Patients")')).toBeVisible()
    await expect(page.locator('button:has-text("Manage Availability")')).toBeVisible()
    await expect(page.locator('button:has-text("Add Medical Record")')).toBeVisible()
  })

  test('should display today\'s appointments', async ({ page }) => {
    // Should show today's appointments section
    await expect(page.locator('text=Today\'s Appointments')).toBeVisible()
    
    // Should show time slots
    await expect(page.locator('[data-testid="appointment-timeline"]')).toBeVisible()
    
    // Should show appointment details or empty state
    const appointments = page.locator('[data-testid="appointment-slot"]')
    const emptyState = page.locator('text=No appointments scheduled for today')
    
    await expect(appointments.or(emptyState)).toBeVisible()
  })

  test('should navigate to patient list from dashboard', async ({ page }) => {
    await page.click('button:has-text("View All Patients")')
    await expect(page).toHaveURL(/.*patients/)
    
    // Should show patients page
    await expect(page.locator('text=Patient List')).toBeVisible()
  })

  test('should show recent patient interactions', async ({ page }) => {
    // Should show recent interactions section
    await expect(page.locator('text=Recent Patient Interactions')).toBeVisible()
    
    // Should show interaction cards or empty state
    const interactions = page.locator('[data-testid="patient-interaction"]')
    const emptyState = page.locator('text=No recent interactions')
    
    await expect(interactions.or(emptyState)).toBeVisible()
  })

  test('should allow quick appointment status updates', async ({ page }) => {
    // If there are appointments, should allow quick status updates
    const appointmentSlot = page.locator('[data-testid="appointment-slot"]').first()
    
    if (await appointmentSlot.isVisible()) {
      await appointmentSlot.click()
      
      // Should show quick action buttons
      await expect(page.locator('button:has-text("Mark Complete")')).toBeVisible()
      await expect(page.locator('button:has-text("Add Notes")')).toBeVisible()
    }
  })
})

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin@test.com', 'TestPass123!')
  })

  test('should display admin dashboard overview', async ({ page }) => {
    // Should show welcome message
    await expect(page.locator('text=Welcome back, Test Admin')).toBeVisible()
    
    // Should show system overview
    await expect(page.locator('text=System Overview')).toBeVisible()
    
    // Should show system statistics
    await expect(page.locator('[data-testid="total-users-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-doctors-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-patients-count"]')).toBeVisible()
    await expect(page.locator('[data-testid="total-appointments-count"]')).toBeVisible()
    
    // Should show admin actions
    await expect(page.locator('button:has-text("Manage Users")')).toBeVisible()
    await expect(page.locator('button:has-text("System Settings")')).toBeVisible()
    await expect(page.locator('button:has-text("View Reports")')).toBeVisible()
  })

  test('should display system health indicators', async ({ page }) => {
    // Should show system health section
    await expect(page.locator('text=System Health')).toBeVisible()
    
    // Should show health indicators
    await expect(page.locator('[data-testid="system-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="database-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="api-status"]')).toBeVisible()
  })

  test('should navigate to user management from dashboard', async ({ page }) => {
    await page.click('button:has-text("Manage Users")')
    await expect(page).toHaveURL(/.*admin\/users/)
    
    // Should show user management page
    await expect(page.locator('text=User Management')).toBeVisible()
  })

  test('should show recent activities', async ({ page }) => {
    // Should show recent activities section
    await expect(page.locator('text=Recent Activities')).toBeVisible()
    
    // Should show activity feed or empty state
    const activities = page.locator('[data-testid="activity-item"]')
    const emptyState = page.locator('text=No recent activities')
    
    await expect(activities.or(emptyState)).toBeVisible()
  })

  test('should display revenue analytics', async ({ page }) => {
    // Should show revenue section
    await expect(page.locator('text=Revenue Analytics')).toBeVisible()
    
    // Should show revenue charts or data
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="monthly-revenue"]')).toBeVisible()
  })
})

test.describe('Navigation and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
  })

  test('should display main navigation menu', async ({ page }) => {
    // Should show navigation sidebar or menu
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible()
    
    // Should show navigation items
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Appointments')).toBeVisible()
    await expect(page.locator('text=Medical Records')).toBeVisible()
    await expect(page.locator('text=Profile')).toBeVisible()
  })

  test('should navigate between pages using sidebar', async ({ page }) => {
    // Navigate to appointments
    await page.click('nav >> text=Appointments')
    await expect(page).toHaveURL(/.*appointments/)
    
    // Navigate to medical records
    await page.click('nav >> text=Medical Records')
    await expect(page).toHaveURL(/.*medical-records/)
    
    // Navigate back to dashboard
    await page.click('nav >> text=Dashboard')
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('should show user profile in header', async ({ page }) => {
    // Should show user avatar/name in header
    await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()
    await expect(page.locator('text=Test Patient')).toBeVisible()
    
    // Should show user menu when clicked
    await page.click('[data-testid="user-profile"]')
    await expect(page.locator('text=Profile Settings')).toBeVisible()
    await expect(page.locator('text=Logout')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Should show mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Should hide desktop sidebar
    await expect(page.locator('[data-testid="desktop-sidebar"]')).not.toBeVisible()
    
    // Should open mobile menu when clicked
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible()
  })

  test('should show breadcrumbs for navigation', async ({ page }) => {
    // Navigate to a nested page
    await page.click('text=Appointments')
    await page.click('text=Book Appointment')
    
    // Should show breadcrumbs
    await expect(page.locator('[data-testid="breadcrumbs"]')).toBeVisible()
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Appointments')).toBeVisible()
    await expect(page.locator('text=Book Appointment')).toBeVisible()
  })

  test('should handle page refresh correctly', async ({ page }) => {
    // Navigate to appointments page
    await page.click('text=Appointments')
    await expect(page).toHaveURL(/.*appointments/)
    
    // Refresh page
    await page.reload()
    
    // Should stay on appointments page
    await expect(page).toHaveURL(/.*appointments/)
    await expect(page.locator('text=My Appointments')).toBeVisible()
    
    // Should maintain authentication
    await expect(page.locator('text=Test Patient')).toBeVisible()
  })
})
