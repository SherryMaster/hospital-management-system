/**
 * Artillery Processor Functions
 * Custom functions for Artillery load testing
 */

module.exports = {
  setAuthHeader,
  generateRandomData,
  logResponse,
  validateResponse,
  setupTestData
};

/**
 * Set authorization header with JWT token
 */
function setAuthHeader(requestParams, context, ee, next) {
  if (context.vars.accessToken) {
    requestParams.headers = requestParams.headers || {};
    requestParams.headers['Authorization'] = `Bearer ${context.vars.accessToken}`;
  }
  return next();
}

/**
 * Generate random test data
 */
function generateRandomData(requestParams, context, ee, next) {
  // Generate random patient data
  context.vars.randomPatient = {
    firstName: generateRandomName(),
    lastName: generateRandomName(),
    email: `patient${Math.floor(Math.random() * 10000)}@example.com`,
    phone: generateRandomPhone(),
    dateOfBirth: generateRandomDate()
  };
  
  // Generate random appointment data
  context.vars.randomAppointment = {
    date: generateFutureDate(),
    time: generateRandomTime(),
    reason: generateRandomReason()
  };
  
  return next();
}

/**
 * Log response for debugging
 */
function logResponse(requestParams, response, context, ee, next) {
  if (process.env.DEBUG_ARTILLERY) {
    console.log(`Response Status: ${response.statusCode}`);
    console.log(`Response Time: ${response.timings.response}ms`);
    
    if (response.statusCode >= 400) {
      console.log(`Error Response: ${response.body}`);
    }
  }
  
  // Track custom metrics
  if (response.timings.response > 2000) {
    ee.emit('counter', 'slow_responses', 1);
  }
  
  if (response.statusCode >= 500) {
    ee.emit('counter', 'server_errors', 1);
  }
  
  return next();
}

/**
 * Validate response data
 */
function validateResponse(requestParams, response, context, ee, next) {
  try {
    if (response.headers['content-type'] && 
        response.headers['content-type'].includes('application/json')) {
      
      const data = JSON.parse(response.body);
      
      // Validate common response structure
      if (response.statusCode === 200 && Array.isArray(data.results)) {
        // Paginated response validation
        if (!data.count || !data.results) {
          ee.emit('counter', 'invalid_paginated_response', 1);
        }
      }
      
      // Validate authentication responses
      if (requestParams.url.includes('/auth/login/') && response.statusCode === 200) {
        if (!data.access || !data.refresh) {
          ee.emit('counter', 'invalid_auth_response', 1);
        }
      }
      
      // Validate appointment creation
      if (requestParams.url.includes('/appointments/') && 
          requestParams.method === 'POST' && 
          response.statusCode === 201) {
        if (!data.id || !data.appointment_date) {
          ee.emit('counter', 'invalid_appointment_response', 1);
        }
      }
    }
  } catch (error) {
    ee.emit('counter', 'json_parse_errors', 1);
  }
  
  return next();
}

/**
 * Setup test data before scenarios
 */
function setupTestData(context, ee, next) {
  // Initialize test users
  context.vars.testUsers = [
    {
      username: 'loadtest1@example.com',
      password: 'testpassword123',
      role: 'patient'
    },
    {
      username: 'loadtest2@example.com', 
      password: 'testpassword123',
      role: 'patient'
    },
    {
      username: 'doctor.loadtest@hospital.com',
      password: 'doctorpassword123',
      role: 'doctor'
    }
  ];
  
  // Initialize test data counters
  context.vars.requestCount = 0;
  context.vars.errorCount = 0;
  
  return next();
}

// Helper functions

function generateRandomName() {
  const names = [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily',
    'Robert', 'Jessica', 'William', 'Ashley', 'James', 'Amanda'
  ];
  return names[Math.floor(Math.random() * names.length)];
}

function generateRandomPhone() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `+1${areaCode}${exchange}${number}`;
}

function generateRandomDate() {
  const start = new Date(1950, 0, 1);
  const end = new Date(2005, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateFutureDate() {
  const today = new Date();
  const futureDate = new Date(today.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000);
  return futureDate.toISOString().split('T')[0];
}

function generateRandomTime() {
  const hours = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
  const minutes = Math.random() < 0.5 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

function generateRandomReason() {
  const reasons = [
    'Regular checkup',
    'Follow-up consultation',
    'Routine examination',
    'Specialist consultation',
    'Health screening',
    'Vaccination',
    'Lab results review',
    'Prescription renewal'
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}
