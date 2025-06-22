/**
 * Global Setup for E2E Tests
 * 
 * Prepares test environment, creates test data, and sets up authentication
 */

import { chromium } from '@playwright/test'

async function globalSetup() {
  console.log('🚀 Starting E2E Test Global Setup...')

  // Launch browser for setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Wait for backend to be ready
    console.log('⏳ Waiting for backend server...')
    await page.goto('http://localhost:8000/api/health/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    })
    console.log('✅ Backend server is ready')

    // Wait for frontend to be ready
    console.log('⏳ Waiting for frontend server...')
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    })
    console.log('✅ Frontend server is ready')

    // Create test users via API
    console.log('👥 Creating test users...')
    await createTestUsers(page)

    // Setup test data
    console.log('📊 Setting up test data...')
    await setupTestData(page)

    console.log('✅ Global setup completed successfully')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function createTestUsers(page) {
  const testUsers = [
    {
      username: 'test_admin',
      email: 'admin@test.com',
      password: 'TestPass123!',
      first_name: 'Test',
      last_name: 'Admin',
      role: 'admin'
    },
    {
      username: 'test_doctor',
      email: 'doctor@test.com',
      password: 'TestPass123!',
      first_name: 'Dr. Test',
      last_name: 'Doctor',
      role: 'doctor'
    },
    {
      username: 'test_patient',
      email: 'patient@test.com',
      password: 'TestPass123!',
      first_name: 'Test',
      last_name: 'Patient',
      role: 'patient'
    }
  ]

  for (const user of testUsers) {
    try {
      const response = await page.request.post('http://localhost:8000/api/auth/register/', {
        data: user,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok()) {
        console.log(`✅ Created test user: ${user.email}`)
      } else {
        const error = await response.text()
        console.log(`⚠️ User ${user.email} might already exist: ${error}`)
      }
    } catch (error) {
      console.log(`⚠️ Error creating user ${user.email}:`, error.message)
    }
  }
}

async function setupTestData(page) {
  try {
    // Login as admin to create test data
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
      console.log('⚠️ Could not login as admin to create test data')
      return
    }

    const loginData = await loginResponse.json()
    const authToken = loginData.access

    // Create test departments
    const departments = [
      { name: 'Cardiology', description: 'Heart and cardiovascular care' },
      { name: 'Neurology', description: 'Brain and nervous system care' },
      { name: 'Pediatrics', description: 'Children healthcare' }
    ]

    for (const dept of departments) {
      try {
        await page.request.post('http://localhost:8000/api/departments/', {
          data: dept,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })
        console.log(`✅ Created department: ${dept.name}`)
      } catch (error) {
        console.log(`⚠️ Department ${dept.name} might already exist`)
      }
    }

    // Create test appointments (if needed)
    console.log('✅ Test data setup completed')

  } catch (error) {
    console.log('⚠️ Error setting up test data:', error.message)
  }
}

export default globalSetup
