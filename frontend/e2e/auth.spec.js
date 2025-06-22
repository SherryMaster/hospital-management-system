/**
 * Authentication E2E Tests
 *
 * Tests complete authentication workflows including login, logout, and role-based access
 */

import { test, expect } from '@playwright/test'

// Helper function to login
async function loginAs(page, email, password) {
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

test.describe('Authentication Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test('should display login page for unauthenticated users', async ({ page }) => {
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/)
    
    // Should show login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Should show hospital branding
    await expect(page.locator('text=Hospital Management System')).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login')
    
    // Fill in login form
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Should show user information
    await expect(page.locator('text=Test Patient')).toBeVisible()
    
    // Should show logout option
    await expect(page.locator('text=Logout')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
    
    // Should remain on login page
    await expect(page).toHaveURL(/.*login/)
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Click logout
    await page.click('text=Logout')
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/)
    
    // Should not show user information
    await expect(page.locator('text=Test Patient')).not.toBeVisible()
  })

  test('should persist authentication across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Refresh page
    await page.reload()
    
    // Should still be authenticated
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('text=Test Patient')).toBeVisible()
  })

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page
    await page.goto('/appointments')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
    
    // Login
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Should redirect to originally requested page
    await expect(page).toHaveURL(/.*appointments/)
  })
})

test.describe('Role-Based Access Control', () => {
  test('patient should access patient dashboard', async ({ page }) => {
    // Login as patient
    await page.goto('/login')
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Should see patient-specific content
    await expect(page.locator('text=My Appointments')).toBeVisible()
    await expect(page.locator('text=Medical Records')).toBeVisible()
    await expect(page.locator('text=Book Appointment')).toBeVisible()
    
    // Should not see admin content
    await expect(page.locator('text=User Management')).not.toBeVisible()
  })

  test('doctor should access doctor dashboard', async ({ page }) => {
    // Login as doctor
    await page.goto('/login')
    await page.fill('input[type="email"]', 'doctor@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Should see doctor-specific content
    await expect(page.locator('text=Today\'s Schedule')).toBeVisible()
    await expect(page.locator('text=Patient List')).toBeVisible()
    await expect(page.locator('text=Availability')).toBeVisible()
    
    // Should not see patient-specific content
    await expect(page.locator('text=Book Appointment')).not.toBeVisible()
  })

  test('admin should access admin dashboard', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Should see admin-specific content
    await expect(page.locator('text=User Management')).toBeVisible()
    await expect(page.locator('text=System Overview')).toBeVisible()
    await expect(page.locator('text=Reports')).toBeVisible()
    
    // Should have access to all areas
    await expect(page.locator('text=Appointments')).toBeVisible()
    await expect(page.locator('text=Patients')).toBeVisible()
    await expect(page.locator('text=Doctors')).toBeVisible()
  })

  test('should prevent unauthorized access to admin pages', async ({ page }) => {
    // Login as patient
    await page.goto('/login')
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    // Try to access admin page
    await page.goto('/admin/users')
    
    // Should be redirected or show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible()
  })
})

test.describe('Session Management', () => {
  test('should handle session expiration', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'patient@test.com')
    await page.fill('input[type="password"]', 'TestPass123!')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/.*dashboard/)
    
    // Simulate session expiration by clearing storage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Try to access protected page
    await page.goto('/appointments')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
  })

  test('should handle concurrent sessions', async ({ browser }) => {
    // Create two browser contexts (simulate two tabs/windows)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()
    
    // Login in first context
    await page1.goto('/login')
    await page1.fill('input[type="email"]', 'patient@test.com')
    await page1.fill('input[type="password"]', 'TestPass123!')
    await page1.click('button[type="submit"]')
    
    await expect(page1).toHaveURL(/.*dashboard/)
    
    // Login in second context
    await page2.goto('/login')
    await page2.fill('input[type="email"]', 'patient@test.com')
    await page2.fill('input[type="password"]', 'TestPass123!')
    await page2.click('button[type="submit"]')
    
    await expect(page2).toHaveURL(/.*dashboard/)
    
    // Both sessions should be valid
    await expect(page1.locator('text=Test Patient')).toBeVisible()
    await expect(page2.locator('text=Test Patient')).toBeVisible()
    
    await context1.close()
    await context2.close()
  })
})
