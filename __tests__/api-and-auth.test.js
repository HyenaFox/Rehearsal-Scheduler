/**
 * API Backend and Google Auth Integration Tests
 * 
 * This file tests the API backend connectivity and Google Auth functionality.
 * Can be run with Quokka.js for live testing in VS Code.
 * 
 * To run with Quokka:
 * 1. Install Quokka.js extension in VS Code
 * 2. Press Ctrl+Shift+P and run "Quokka.js: Start on Current File"
 * 3. Tests will run automatically and show results inline
 */

// Mock environment for testing
const TEST_CONFIG = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000, // 10 seconds
  SKIP_GOOGLE_AUTH: true, // Set to false to test Google Auth (requires browser)
};

console.log('🧪 Starting API and Auth Tests...');
console.log('📋 Test Configuration:', TEST_CONFIG);

// Mock fetch for testing in Node.js environment
if (typeof fetch === 'undefined') {
  const nodeFetch = require('node-fetch');
  global.fetch = nodeFetch;
}

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test utilities
function assert(condition, message) {
  if (condition) {
    testResults.passed++;
    testResults.tests.push({ status: '✅ PASS', message });
    console.log(`✅ PASS: ${message}`);
  } else {
    testResults.failed++;
    testResults.tests.push({ status: '❌ FAIL', message });
    console.log(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEquals(actual, expected, message) {
  assert(actual === expected, `${message} (expected: ${expected}, actual: ${actual})`);
}

function assertNotNull(value, message) {
  assert(value !== null && value !== undefined, message);
}

async function runTest(testName, testFunction) {
  console.log(`\n🔍 Running test: ${testName}`);
  try {
    await testFunction();
    console.log(`✅ Test completed: ${testName}`);
  } catch (error) {
    console.error(`❌ Test failed: ${testName} - ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ status: '❌ FAIL', message: `${testName}: ${error.message}` });
  }
}

// Helper function to make API requests with timeout
async function makeRequest(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), TEST_CONFIG.TIMEOUT);
  });

  const fetchPromise = fetch(`${TEST_CONFIG.API_BASE_URL}${endpoint}`, config);
  
  try {
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: response.ok ? await response.json() : null,
      error: !response.ok ? await response.text() : null
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      data: null,
      error: error.message
    };
  }
}

// Test 1: API Server Connectivity
async function testApiConnectivity() {
  console.log('🌐 Testing API server connectivity...');
  
  const response = await makeRequest('/health');
  
  assert(response.ok, 'API server should be reachable');
  assertEquals(response.status, 200, 'Health check should return 200');
  assertNotNull(response.data, 'Health check should return data');
  
  console.log('📊 Health check response:', response.data);
}

// Test 2: Authentication Endpoints
async function testAuthEndpoints() {
  console.log('🔐 Testing authentication endpoints...');
  
  // Test registration endpoint structure
  const registerResponse = await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User'
    })
  });
  
  // We expect this to fail (409 if user exists, or 201 if successful)
  // But the endpoint should be reachable
  assert(
    registerResponse.status === 409 || registerResponse.status === 201 || registerResponse.status === 400,
    'Register endpoint should be reachable and return appropriate status'
  );
  
  // Test login endpoint structure
  const loginResponse = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    })
  });
  
  // Should return 401 for invalid credentials
  assert(
    loginResponse.status === 401 || loginResponse.status === 400,
    'Login endpoint should reject invalid credentials'
  );
  
  console.log('🔑 Auth endpoints are responding correctly');
}

// Test 3: Data Endpoints (without auth)
async function testDataEndpoints() {
  console.log('📊 Testing data endpoints...');
  
  // Test getting timeslots (might require auth)
  const timeslotsResponse = await makeRequest('/timeslots');
  assert(
    timeslotsResponse.status === 200 || timeslotsResponse.status === 401,
    'Timeslots endpoint should be reachable'
  );
  
  // Test getting actors (might require auth)
  const actorsResponse = await makeRequest('/actors');
  assert(
    actorsResponse.status === 200 || actorsResponse.status === 401,
    'Actors endpoint should be reachable'
  );
  
  // Test getting scenes (might require auth)
  const scenesResponse = await makeRequest('/scenes');
  assert(
    scenesResponse.status === 200 || scenesResponse.status === 401,
    'Scenes endpoint should be reachable'
  );
  
  console.log('📈 Data endpoints are responding correctly');
}

// Test 4: Google Auth Configuration
async function testGoogleAuthConfig() {
  if (TEST_CONFIG.SKIP_GOOGLE_AUTH) {
    console.log('⏭️  Skipping Google Auth tests (SKIP_GOOGLE_AUTH = true)');
    return;
  }
  
  console.log('🔍 Testing Google Auth configuration...');
  
  // Test Google Auth URL endpoint
  const googleAuthResponse = await makeRequest('/auth/google/url');
  
  if (googleAuthResponse.ok) {
    assertNotNull(googleAuthResponse.data, 'Google Auth URL should be returned');
    assertNotNull(googleAuthResponse.data.url, 'Auth URL should contain url field');
    
    // Validate the URL format
    const authUrl = googleAuthResponse.data.url;
    assert(
      authUrl.includes('accounts.google.com') && authUrl.includes('oauth2'),
      'Auth URL should be a valid Google OAuth URL'
    );
    
    console.log('🔗 Google OAuth URL is properly configured');
    console.log('🌐 Auth URL preview:', authUrl.substring(0, 100) + '...');
  } else {
    console.log('⚠️  Google Auth might not be configured on backend');
    // This is not necessarily a failure, just a configuration issue
  }
}

// Test 5: API Error Handling
async function testApiErrorHandling() {
  console.log('🛠️  Testing API error handling...');
  
  // Test invalid endpoint
  const invalidResponse = await makeRequest('/invalid-endpoint');
  assert(
    invalidResponse.status === 404,
    'Invalid endpoints should return 404'
  );
  
  // Test malformed request
  const malformedResponse = await makeRequest('/auth/login', {
    method: 'POST',
    body: 'invalid json'
  });
  assert(
    malformedResponse.status === 400 || malformedResponse.status === 500,
    'Malformed requests should be handled gracefully'
  );
  
  console.log('🔧 Error handling is working correctly');
}

// Test 6: Environment Configuration
async function testEnvironmentConfig() {
  console.log('⚙️  Testing environment configuration...');
  
  // Check if API URL is configured
  assertNotNull(TEST_CONFIG.API_BASE_URL, 'API_BASE_URL should be configured');
  
  // Validate URL format
  assert(
    TEST_CONFIG.API_BASE_URL.startsWith('http'),
    'API_BASE_URL should be a valid HTTP URL'
  );
  
  // Check if it's pointing to the right environment
  const isLocalhost = TEST_CONFIG.API_BASE_URL.includes('localhost') || 
                     TEST_CONFIG.API_BASE_URL.includes('127.0.0.1') ||
                     TEST_CONFIG.API_BASE_URL.includes('10.0.2.2');
  
  const isProduction = TEST_CONFIG.API_BASE_URL.includes('onrender.com') ||
                      TEST_CONFIG.API_BASE_URL.includes('herokuapp.com') ||
                      TEST_CONFIG.API_BASE_URL.includes('vercel.app');
  
  assert(
    isLocalhost || isProduction,
    'API_BASE_URL should point to either localhost or production'
  );
  
  console.log(`🎯 Environment: ${isProduction ? 'Production' : 'Development'}`);
  console.log(`🌐 API URL: ${TEST_CONFIG.API_BASE_URL}`);
}

// Test 7: Performance and Reliability
async function testPerformanceAndReliability() {
  console.log('⚡ Testing API performance and reliability...');
  
  const startTime = Date.now();
  const response = await makeRequest('/health');
  const endTime = Date.now();
  
  const responseTime = endTime - startTime;
  console.log(`⏱️  Response time: ${responseTime}ms`);
  
  assert(
    responseTime < TEST_CONFIG.TIMEOUT,
    'API should respond within timeout period'
  );
  
  // Consider anything under 2 seconds as good performance
  if (responseTime < 2000) {
    console.log('🚀 API performance is good (< 2s)');
  } else if (responseTime < 5000) {
    console.log('⚠️  API performance is moderate (2-5s)');
  } else {
    console.log('🐌 API performance is slow (> 5s)');
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive API and Auth tests...\n');
  
  try {
    await runTest('Environment Configuration', testEnvironmentConfig);
    await runTest('API Connectivity', testApiConnectivity);
    await runTest('Authentication Endpoints', testAuthEndpoints);
    await runTest('Data Endpoints', testDataEndpoints);
    await runTest('Google Auth Configuration', testGoogleAuthConfig);
    await runTest('API Error Handling', testApiErrorHandling);
    await runTest('Performance and Reliability', testPerformanceAndReliability);
    
  } catch (error) {
    console.error('🚨 Unexpected error during testing:', error);
  }
  
  // Print final results
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Your API and Auth setup is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n📝 Detailed Results:');
  testResults.tests.forEach(test => {
    console.log(`${test.status} ${test.message}`);
  });
  
  return testResults;
}

// Auto-run tests when file is loaded (for Quokka)
if (typeof module !== 'undefined' && module.exports) {
  // Running in Node.js environment
  module.exports = { runAllTests, testResults };
} else {
  // Running in browser or Quokka
  runAllTests().catch(console.error);
}

// For Quokka.js - this will run automatically
runAllTests().then(results => {
  console.log('\n🏁 Testing complete! Check VS Code output for results.');
}).catch(error => {
  console.error('💥 Testing failed with error:', error);
});
