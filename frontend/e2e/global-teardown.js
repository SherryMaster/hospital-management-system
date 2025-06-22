/**
 * Global Teardown for E2E Tests
 * 
 * Cleans up test environment and test data
 */

import { chromium } from '@playwright/test'

async function globalTeardown() {
  console.log('🧹 Starting E2E Test Global Teardown...')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Clean up test data if needed
    console.log('🗑️ Cleaning up test data...')
    await cleanupTestData(page)

    console.log('✅ Global teardown completed successfully')

  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page) {
  try {
    // Login as admin to clean up test data
    const loginResponse = await page.request.post('http://localhost:8000/api/auth/login/', {
      data: {
        email: 'admin@test.com',
        password: 'TestPass123!'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!loginResponse.ok()) {
      console.log('⚠️ Could not login as admin for cleanup')
      return
    }

    const loginData = await loginResponse.json()
    const authToken = loginData.access

    // Clean up test appointments
    try {
      const appointmentsResponse = await page.request.get('http://localhost:8000/api/appointments/', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (appointmentsResponse.ok()) {
        const appointments = await appointmentsResponse.json()
        for (const appointment of appointments.results || []) {
          if (appointment.patient?.email?.includes('@test.com')) {
            await page.request.delete(`http://localhost:8000/api/appointments/${appointment.id}/`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              }
            })
          }
        }
        console.log('✅ Cleaned up test appointments')
      }
    } catch (error) {
      console.log('⚠️ Error cleaning up appointments:', error.message)
    }

    // Note: We don't delete test users as they might be needed for multiple test runs
    // In a real environment, you might want to clean them up or use a test database

    console.log('✅ Test data cleanup completed')

  } catch (error) {
    console.log('⚠️ Error during cleanup:', error.message)
  }
}

export default globalTeardown
