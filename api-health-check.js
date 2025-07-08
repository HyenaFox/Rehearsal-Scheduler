/**
 * 🚀 Quick API Health Check
 * 
 * This file tests your API backend connectivity in real-time.
 * Perfect for VS Code with Quokka.js extension!
 * 
 * 📋 Instructions:
 * 1. Install Quokka.js extension in VS Code
 * 2. Update API_URL below to match your backend
 * 3. Press Ctrl+Shift+P → "Quokka.js: Start on Current File" 
 * 4. Watch live results appear next to your code! ⚡
 */

// 🔧 Configuration - Update this to match your backend
const API_URL = 'http://localhost:3000/api';  // 👈 Change this if needed

console.log('🧪 API Health Check Starting...');
console.log('🌐 Testing:', API_URL);

// Simple test counter
let testNum = 0;
const nextTest = () => ++testNum;

// 1️⃣ Test: Basic Connectivity
async function testConnection() {
  console.log(`\n${nextTest()}. 🔌 Testing Connection...`);
  
  try {
    const response = await fetch(`${API_URL}/health`);
    console.log(`   Status: ${response.status} ${response.statusText}`); // Shows inline in Quokka
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API is online!');
      console.log('   📊 Response:', data); // Shows data inline
      return true;
    } else {
      console.log('   ❌ API returned error status');
      return false;
    }
  } catch (error) {
    console.log('   💥 Connection failed:', error.message);
    return false;
  }
}

// 2️⃣ Test: Authentication Endpoints
async function testAuth() {
  console.log(`\n${nextTest()}. 🔐 Testing Auth Endpoints...`);
  
  try {
    // Test login with invalid credentials
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@invalid.com',
        password: 'wrongpass'
      })
    });
    
    console.log(`   Login test: ${loginResponse.status}`); // Shows inline
    
    if (loginResponse.status === 401 || loginResponse.status === 400) {
      console.log('   ✅ Login endpoint working (rejects invalid creds)');
      return true;
    } else {
      console.log('   ⚠️ Unexpected login response');
      return false;
    }
  } catch (error) {
    console.log('   💥 Auth test failed:', error.message);
    return false;
  }
}

// 3️⃣ Test: Data Endpoints
async function testDataEndpoints() {
  console.log(`\n${nextTest()}. 📊 Testing Data Endpoints...`);
  
  const endpoints = ['/actors', '/timeslots', '/scenes'];
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      const name = endpoint.replace('/', '');
      
      console.log(`   ${name}: ${response.status}`); // Shows inline
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   📈 ${name} count: ${Array.isArray(data) ? data.length : 'object'}`);
        results.push(`✅ ${name}`);
      } else if (response.status === 401) {
        console.log(`   🔒 ${name} requires authentication`);
        results.push(`🔒 ${name}`);
      } else {
        results.push(`❌ ${name}`);
      }
    } catch (error) {
      console.log(`   💥 ${endpoint} failed: ${error.message}`);
      results.push(`💥 ${endpoint.replace('/', '')}`);
    }
  }
  
  console.log('   📋 Results:', results.join(', '));
  return results.filter(r => r.includes('✅') || r.includes('🔒')).length > 0;
}

// 4️⃣ Test: Performance
async function testPerformance() {
  console.log(`\n${nextTest()}. ⚡ Testing Performance...`);
  
  const start = performance.now();
  
  try {
    await fetch(`${API_URL}/health`);
    const duration = Math.round(performance.now() - start);
    
    console.log(`   ⏱️ Response time: ${duration}ms`); // Shows inline
    
    if (duration < 1000) {
      console.log('   🚀 Excellent performance!');
    } else if (duration < 3000) {
      console.log('   👍 Good performance');
    } else {
      console.log('   🐌 Slow performance');
    }
    
    return duration < 5000; // Under 5 seconds is acceptable
  } catch (error) {
    console.log('   💥 Performance test failed:', error.message);
    return false;
  }
}

// 5️⃣ Test: Google Auth Check
async function testGoogleAuth() {
  console.log(`\n${nextTest()}. 🔍 Testing Google Auth...`);
  
  try {
    const response = await fetch(`${API_URL}/auth/google/url`);
    console.log(`   Google auth status: ${response.status}`); // Shows inline
    
    if (response.ok) {
      const data = await response.json();
      if (data.url && data.url.includes('google')) {
        console.log('   ✅ Google Auth is configured');
        console.log('   🔗 OAuth URL detected');
        return true;
      }
    }
    
    console.log('   ⚠️ Google Auth not configured (optional)');
    return false; // Not a failure, just not configured
  } catch (error) {
    console.log('   💥 Google auth test failed:', error.message);
    return false;
  }
}

// 🏃‍♂️ Run All Tests
async function runHealthCheck() {
  console.log('\n🚀 Starting API Health Check...\n');
  
  const results = [];
  
  // Run tests sequentially for better Quokka display
  results.push(await testConnection());
  results.push(await testAuth());
  results.push(await testDataEndpoints());
  results.push(await testPerformance());
  results.push(await testGoogleAuth());
  
  // 📊 Summary
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('\n📊 HEALTH CHECK SUMMARY');
  console.log('=======================');
  console.log(`Tests Passed: ${passed}/${total}`); // Shows inline
  console.log(`Success Rate: ${Math.round((passed/total) * 100)}%`); // Shows inline
  
  if (passed === total) {
    console.log('🎉 All systems go! Your API is healthy! 🎉');
  } else if (passed >= total * 0.7) {
    console.log('👍 API is mostly working, check warnings above');
  } else {
    console.log('⚠️ API has issues, check errors above');
  }
  
  console.log('\n✨ Health check complete!');
  return { passed, total, success: passed === total };
}

// 🚀 Auto-run for Quokka (starts immediately when file opens)
runHealthCheck()
  .then(result => {
    // This shows the final result inline in Quokka
    console.log(`\n🎯 Final Result: ${result.success ? 'SUCCESS' : 'ISSUES'}`);
  })
  .catch(error => {
    console.error('💥 Health check crashed:', error);
  });

/*
 * 🔧 TROUBLESHOOTING:
 * 
 * ❌ Connection failed?
 *    → Check if backend is running: npm run backend
 *    → Update API_URL at the top of this file
 * 
 * ❌ Auth tests failing?
 *    → Normal if you haven't set up authentication yet
 * 
 * ❌ Data tests returning 401?
 *    → Normal if endpoints require authentication
 * 
 * 🔗 Common API URLs:
 *    → Local: http://localhost:3000/api
 *    → Android Emulator: http://10.0.2.2:3000/api  
 *    → Production: https://your-app.onrender.com/api
 */
