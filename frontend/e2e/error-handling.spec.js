/**
 * Error Handling and Edge Cases E2E Tests
 * 
 * Tests error scenarios, network failures, and edge cases
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

test.describe('Network Error Handling', () => {
  test('should handle API server downtime gracefully', async ({ page }) => {
    // Block all API requests to simulate server downtime
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('/login')
    
    // Try to login
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Should show network error message
    await expect(page.locator('text=Unable to connect to server')).toBeVisible()
    await expect(page.locator('text=Please check your internet connection')).toBeVisible()
    
    // Should show retry button
    await expect(page.locator('button:has-text("Retry")')).toBeVisible()
  })

  test('should handle slow network connections', async ({ page }) => {
    // Simulate slow network
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.continue()
    })
    
    await page.goto('/login')
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Should show loading indicator
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    await expect(page.locator('text=Signing in...')).toBeVisible()
  })

  test('should handle intermittent network failures', async ({ page }) => {
    let requestCount = 0
    
    // Fail first request, succeed on retry
    await page.route('**/api/auth/login/', route => {
      requestCount++
      if (requestCount === 1) {
        route.abort()
      } else {
        route.continue()
      }
    })
    
    await page.goto('/login')
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Should show error first
    await expect(page.locator('text=Network error')).toBeVisible()
    
    // Click retry
    await page.click('button:has-text("Retry")')
    
    // Should succeed on retry
    await expect(page).toHaveURL(/.*dashboard/)
  })
})

test.describe('Form Validation and Error States', () => {
  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/login')
    
    // Submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
    
    // Fill invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    
    // Should show email format error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('should handle server validation errors', async ({ page }) => {
    // Mock server validation error
    await page.route('**/api/auth/login/', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          email: ['This email is not registered'],
          non_field_errors: ['Invalid credentials']
        })
      })
    })
    
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nonexistent@test.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show server validation errors
    await expect(page.locator('text=This email is not registered')).toBeVisible()
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should handle appointment booking validation errors', async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
    
    // Mock validation error for appointment booking
    await page.route('**/api/appointments/', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          appointment_date: ['Cannot book appointments in the past'],
          appointment_time: ['This time slot is not available']
        })
      })
    })
    
    await page.click('text=Book Appointment')
    
    // Complete booking form with invalid data
    await page.click('[data-testid="department-cardiology"]')
    await page.click('[data-testid="doctor-card"]')
    
    // Select past date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateString = yesterday.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateString)
    
    await page.click('[data-testid="time-slot-10:00"]')
    await page.click('button:has-text("Book Appointment")')
    
    // Should show validation errors
    await expect(page.locator('text=Cannot book appointments in the past')).toBeVisible()
    await expect(page.locator('text=This time slot is not available')).toBeVisible()
  })
})

test.describe('Authentication Edge Cases', () => {
  test('should handle expired session gracefully', async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
    
    // Mock expired token response
    await page.route('**/api/**', route => {
      if (route.request().url().includes('/auth/')) {
        route.continue()
      } else {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Token has expired'
          })
        })
      }
    })
    
    // Try to access protected resource
    await page.click('text=Appointments')
    
    // Should redirect to login with message
    await expect(page).toHaveURL(/.*login/)
    await expect(page.locator('text=Your session has expired')).toBeVisible()
    await expect(page.locator('text=Please log in again')).toBeVisible()
  })

  test('should handle account deactivation', async ({ page }) => {
    // Mock account deactivated response
    await page.route('**/api/auth/login/', route => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Account has been deactivated'
        })
      })
    })
    
    await page.goto('/login')
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Should show account deactivated message
    await expect(page.locator('text=Account has been deactivated')).toBeVisible()
    await expect(page.locator('text=Please contact support')).toBeVisible()
  })

  test('should handle concurrent login sessions', async ({ browser }) => {
    // Create two browser contexts
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    // Login in both contexts
    await loginAs(page1, 'patient@test.com', 'TestPass123!')
    await loginAs(page2, 'patient@test.com', 'TestPass123!')
    
    // Both should work initially
    await expect(page1.locator('text=Test Patient')).toBeVisible()
    await expect(page2.locator('text=Test Patient')).toBeVisible()
    
    // If system enforces single session, one should be logged out
    // This depends on backend implementation
    
    await context1.close()
    await context2.close()
  })
})

test.describe('Data Loading and Error States', () => {
  test('should handle empty data states', async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
    
    // Mock empty appointments response
    await page.route('**/api/appointments/', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [],
          count: 0
        })
      })
    })
    
    await page.click('text=Appointments')
    
    // Should show empty state
    await expect(page.locator('text=No appointments found')).toBeVisible()
    await expect(page.locator('text=Book your first appointment')).toBeVisible()
    await expect(page.locator('button:has-text("Book Appointment")')).toBeVisible()
  })

  test('should handle data loading failures', async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
    
    // Mock API error
    await page.route('**/api/appointments/', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          detail: 'Internal server error'
        })
      })
    })
    
    await page.click('text=Appointments')
    
    // Should show error state
    await expect(page.locator('text=Failed to load appointments')).toBeVisible()
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible()
  })

  test('should handle partial data loading', async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
    
    let requestCount = 0
    
    // Mock partial loading - some requests succeed, others fail
    await page.route('**/api/**', route => {
      requestCount++
      if (requestCount % 2 === 0) {
        route.fulfill({
          status: 500,
          body: 'Server error'
        })
      } else {
        route.continue()
      }
    })
    
    // Should handle mixed success/failure gracefully
    await expect(page.locator('[data-testid="error-banner"]')).toBeVisible()
    await expect(page.locator('text=Some data could not be loaded')).toBeVisible()
  })
})

test.describe('Browser Compatibility and Edge Cases', () => {
  test('should handle browser back/forward navigation', async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
    
    // Navigate through pages
    await page.click('text=Appointments')
    await expect(page).toHaveURL(/.*appointments/)
    
    await page.click('text=Medical Records')
    await expect(page).toHaveURL(/.*medical-records/)
    
    // Use browser back button
    await page.goBack()
    await expect(page).toHaveURL(/.*appointments/)
    
    // Use browser forward button
    await page.goForward()
    await expect(page).toHaveURL(/.*medical-records/)
  })

  test('should handle page refresh during form submission', async ({ page }) => {
    await loginAs(page, 'patient@test.com', 'TestPass123!')
    
    await page.click('text=Book Appointment')
    
    // Start filling form
    await page.click('[data-testid="department-cardiology"]')
    await page.click('[data-testid="doctor-card"]')
    
    // Refresh page during form filling
    await page.reload()
    
    // Should handle gracefully - either restore form or start fresh
    await expect(page.locator('text=Select Department')).toBeVisible()
  })

  test('should handle localStorage/sessionStorage unavailable', async ({ page }) => {
    // Disable storage
    await page.addInitScript(() => {
      delete window.localStorage
      delete window.sessionStorage
    })
    
    await page.goto('/login')
    
    // Should still work without storage (with degraded functionality)
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Should show warning about storage
    await expect(page.locator('text=Browser storage is disabled')).toBeVisible()
  })
})
