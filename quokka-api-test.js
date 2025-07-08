/*
 * Quokka.js Live API & Auth Tests
 * 
 * Instructions for VS Code:
 * 1. Install Quokka.js extension
 * 2. Open this file
 * 3. Press Ctrl+Shift+P → "Quokka.js: Start on Current File"
 * 4. Watch live results appear inline!
 * 
 * Note: Update API_BASE_URL below to match your backend
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000/api'; // 👈 Update this to your backend URL
const TIMEOUT = 8000;

console.log('🧪 Quokka API Tests Starting...');
console.log('🌐 Testing API at:', API_BASE_URL);

// Simple test framework for Quokka
let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name, assertion, expected, actual) {
  testCount++;
  const passed = assertion;
  
  if (passed) {
    passCount++;
    console.log(`✅ ${testCount}. ${name}`);
    if (actual !== undefined) console.log(`   → ${actual}`);
  } else {
    failCount++;
    console.log(`❌ ${testCount}. ${name}`);
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}`);
  }
  
  return passed;
}

// Simple fetch wrapper with timeout
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    
    let data = null;
    try {
      data = await response.json();
    } catch (_e) {
      data = await response.text();
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      data: null
    };
  }
}

// Test 1: Basic Connectivity
async function testConnectivity() {
  console.log('\n🔌 Testing Basic Connectivity...');
  
  const result = await apiCall('/health');
  test('API server is reachable', result.status > 0, 'status > 0', result.status);
  
  if (result.ok) {
    test('Health check returns 200', result.status === 200, '200', result.status);
    console.log('   📊 Health data:', result.data);
  } else {
    console.log(`   ⚠️ Health check failed: ${result.error || result.status}`);
  }
  
  return result.ok;
}

// Test 2: Auth Endpoints
async function testAuth() {
  console.log('\n🔐 Testing Auth Endpoints...');
  
  // Test invalid login
  const loginResult = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@invalid.com',
      password: 'wrongpassword'
    })
  });
  
  test('Login endpoint responds', loginResult.status > 0, 'status > 0', loginResult.status);
  test('Invalid login rejected', loginResult.status === 401 || loginResult.status === 400, '401 or 400', loginResult.status);
  
  // Test registration endpoint
  const regResult = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: 'quokka.test@example.com',
      password: 'testpass123',
      name: 'Quokka Test User'
    })
  });
  
  test('Register endpoint responds', regResult.status > 0, 'status > 0', regResult.status);
  // Could be 201 (created), 409 (exists), or 400 (validation error)
  test('Register returns valid status', [201, 400, 409].includes(regResult.status), '201, 400, or 409', regResult.status);
}

// Test 3: Data Endpoints
async function testDataEndpoints() {
  console.log('\n📊 Testing Data Endpoints...');
  
  const endpoints = ['/actors', '/timeslots', '/scenes'];
  
  for (const endpoint of endpoints) {
    const result = await apiCall(endpoint);
    const endpointName = endpoint.replace('/', '');
    
    test(`${endpointName} endpoint responds`, result.status > 0, 'status > 0', result.status);
    
    if (result.ok) {
      test(`${endpointName} returns data`, Array.isArray(result.data) || typeof result.data === 'object', 'array or object', typeof result.data);
      console.log(`   📈 ${endpointName} count:`, Array.isArray(result.data) ? result.data.length : 'object');
    } else {
      console.log(`   ⚠️ ${endpointName} requires auth (${result.status})`);
    }
  }
}

// Test 4: Google Auth Check
async function testGoogleAuth() {
  console.log('\n🔍 Testing Google Auth Config...');
  
  const result = await apiCall('/auth/google/url');
  
  test('Google auth endpoint responds', result.status > 0, 'status > 0', result.status);
  
  if (result.ok && result.data && result.data.url) {
    test('Google auth URL exists', result.data.url.includes('google'), 'contains "google"', 'true');
    test('Valid OAuth URL', result.data.url.includes('oauth2'), 'contains "oauth2"', 'true');
    console.log('   🔗 OAuth URL preview:', result.data.url.substring(0, 80) + '...');
  } else {
    console.log('   ⚠️ Google auth not configured or requires login');
  }
}

// Test 5: Performance Check
async function testPerformance() {
  console.log('\n⚡ Testing Performance...');
  
  const start = performance.now();
  await apiCall('/health');
  const duration = performance.now() - start;
  
  test('Response under 5 seconds', duration < 5000, '< 5000ms', `${Math.round(duration)}ms`);
  
  if (duration < 1000) {
    console.log('   🚀 Excellent performance (< 1s)');
  } else if (duration < 3000) {
    console.log('   👍 Good performance (< 3s)');
  } else {
    console.log('   🐌 Slow performance (> 3s)');
  }
}

// Test 6: Environment Check
function testEnvironment() {
  console.log('\n⚙️ Testing Environment...');
  
  test('API URL configured', API_BASE_URL.length > 0, 'non-empty', API_BASE_URL);
  test('Valid HTTP URL', API_BASE_URL.startsWith('http'), 'starts with http', 'true');
  
  const isLocal = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1') || API_BASE_URL.includes('10.0.2.2');
  const isProd = API_BASE_URL.includes('.com') && !isLocal;
  
  if (isLocal) {
    console.log('   🏠 Local development environment');
  } else if (isProd) {
    console.log('   🌐 Production environment');
  } else {
    console.log('   ❓ Unknown environment');
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Running Quokka API Tests...\n');
  
  testEnvironment();
  
  const isConnected = await testConnectivity();
  
  if (isConnected) {
    await testAuth();
    await testDataEndpoints();
    await testGoogleAuth();
    await testPerformance();
  } else {
    console.log('\n💥 Cannot connect to API server. Check:');
    console.log('   1. Backend server is running');
    console.log('   2. API_BASE_URL is correct');
    console.log('   3. No firewall blocking connection');
  }
  
  // Results summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total Tests: ${testCount}`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📈 Success Rate: ${testCount > 0 ? Math.round((passCount / testCount) * 100) : 0}%`);
  
  if (failCount === 0 && testCount > 0) {
    console.log('\n🎉 All tests passed! 🎉');
  } else if (failCount > 0) {
    console.log('\n⚠️ Some tests failed. Check your backend setup.');
  }
  
  console.log('\n✨ Quokka testing complete!');
}

// Auto-run for Quokka
runTests().catch(error => {
  console.error('💥 Test error:', error.message);
});

/*
 * 🔧 TROUBLESHOOTING GUIDE:
 * 
 * If tests fail:
 * 1. Make sure your backend is running (npm run backend)
 * 2. Update API_BASE_URL above to match your backend
 * 3. Check console for specific error messages
 * 4. Try accessing your API directly in browser
 * 
 * Common URLs:
 * - Local: http://localhost:3000/api
 * - Android Emulator: http://10.0.2.2:3000/api
 * - Production: https://your-app.onrender.com/api
 */
