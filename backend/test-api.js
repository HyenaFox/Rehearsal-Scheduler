// Test API endpoints
const fetch = require('node-fetch');

async function testAPI() {
  console.log('=== TESTING API ENDPOINTS ===');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test connection
  try {
    console.log('1. Testing /api endpoint...');
    const response = await fetch(`${baseUrl}/api`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API base endpoint working');
      console.log('Response:', data);
    } else {
      console.log('❌ API base endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Cannot connect to API:', error.message);
    console.log('💡 Make sure backend server is running: node src/app.js');
  }
  
  // Test scenes endpoint
  try {
    console.log('2. Testing /api/scenes endpoint...');
    const response = await fetch(`${baseUrl}/api/scenes`);
    if (response.ok) {
      const scenes = await response.json();
      console.log('✅ Scenes endpoint working');
      console.log('Found scenes:', scenes.length);
      if (scenes.length > 0) {
        console.log('Sample scene:', scenes[0]);
      }
    } else {
      console.log('❌ Scenes endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Scenes endpoint error:', error.message);
  }
  
  // Test other endpoints
  const endpoints = ['/api/actors', '/api/rehearsals', '/api/timeslots'];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`3. Testing ${endpoint}...`);
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${endpoint} working - found ${data.length} items`);
      } else {
        console.log(`❌ ${endpoint} failed:`, response.status);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} error:`, error.message);
    }
  }
  
  console.log('=== API TEST COMPLETE ===');
}

testAPI();
