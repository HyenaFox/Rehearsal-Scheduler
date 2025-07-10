// Simple test for backend API integration - Jest version
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Simple fetch implementation for Node.js
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Node.js Test Script'
      }
    };

    const req = lib.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            success: false,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout'
      });
    });

    req.end();
  });
}

async function testBackendConnection() {
  console.log('🧪 Testing Backend API Connection...');
  
  // Try to find a working backend URL
  const possibleUrls = [
    'http://localhost:3001',
    'http://localhost:3000', 
    'https://rehearsal-scheduler-backend.onrender.com'
  ];
  
  let apiUrl = null;
  
  console.log('🔍 Checking for available backend...');
  for (const url of possibleUrls) {
    try {
      console.log(`  Testing: ${url}`);
      const response = await makeRequest(`${url}/api/health`);
      if (response.success) {
        console.log(`  ✅ Found working backend at: ${url}`);
        apiUrl = url;
        break;
      }
    } catch (error) {
      console.log(`  ❌ ${url} not accessible`);
    }
  }
  
  if (!apiUrl) {
    console.log('❌ No backend server found!');
    console.log('Please start your backend server first.');
    return;
  }
  
  console.log(`🔗 Using API URL: ${apiUrl}`);
  
  try {
    // Test all endpoints
    console.log('\n📊 Testing all API endpoints...');
    
    // Test scenes
    console.log('1. Testing scenes API...');
    const scenesResponse = await makeRequest(`${apiUrl}/api/scenes`);
    if (scenesResponse.success) {
      console.log(`✅ Scenes API working - found ${scenesResponse.data.length} scenes`);
    } else {
      console.log('❌ Scenes API failed:', scenesResponse.status);
    }
    
    // Test actors
    console.log('2. Testing actors API...');
    const actorsResponse = await makeRequest(`${apiUrl}/api/actors`);
    if (actorsResponse.success) {
      console.log(`✅ Actors API working - found ${actorsResponse.data.length} actors`);
    } else {
      console.log('❌ Actors API failed:', actorsResponse.status);
    }
    
    // Test rehearsals
    console.log('3. Testing rehearsals API...');
    const rehearsalsResponse = await makeRequest(`${apiUrl}/api/rehearsals`);
    if (rehearsalsResponse.success) {
      console.log(`✅ Rehearsals API working - found ${rehearsalsResponse.data.length} rehearsals`);
    } else {
      console.log('❌ Rehearsals API failed:', rehearsalsResponse.status);
    }
    
    // Test timeslots
    console.log('4. Testing timeslots API...');
    const timeslotsResponse = await makeRequest(`${apiUrl}/api/timeslots`);
    if (timeslotsResponse.success) {
      console.log(`✅ Timeslots API working - found ${timeslotsResponse.data.length} timeslots`);
    } else {
      console.log('❌ Timeslots API failed:', timeslotsResponse.status);
    }
    
    console.log('\n🎉 Backend API test completed!');
    
  } catch (error) {
    console.log('❌ Backend API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure your backend server is running');
    console.log('- Verify your MongoDB connection in the backend');
    console.log('- Check backend logs for errors');
  }
}

// Run the test
describe('MongoDB Integration Tests', () => {
  let apiUrl = null;

  beforeAll(async () => {
    // Find working API URL
    const possibleUrls = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://rehearsal-scheduler-backend.onrender.com'
    ];
    
    console.log('\n🧪 Testing Backend API Integration...');
    console.log('Finding accessible backend...');
    
    for (const url of possibleUrls) {
      try {
        console.log(`  Trying: ${url}`);
        const response = await makeRequest(`${url}/health`);
        if (response.success) {
          console.log(`  ✅ Found working backend at: ${url}`);
          apiUrl = url;
          break;
        }
      } catch (error) {
        console.log(`  ❌ ${url} not accessible`);
      }
    }
    
    if (!apiUrl) {
      throw new Error('No backend server found running! Please start your backend server first.');
    }
  }, 30000);

  test('Health endpoint should be accessible', async () => {
    expect(apiUrl).toBeTruthy();
    const response = await makeRequest(`${apiUrl}/health`);
    expect(response.success).toBe(true);
    expect(response.data.status).toBe('OK');
  });

  test('Scenes API should work', async () => {
    const scenesResponse = await makeRequest(`${apiUrl}/api/scenes`);
    expect(scenesResponse.success).toBe(true);
    expect(Array.isArray(scenesResponse.data)).toBe(true);
    console.log(`✅ Scenes API working - found ${scenesResponse.data.length} scenes`);
  });

  test('Rehearsals API should work', async () => {
    const rehearsalsResponse = await makeRequest(`${apiUrl}/api/rehearsals`);
    expect(rehearsalsResponse.success).toBe(true);
    expect(Array.isArray(rehearsalsResponse.data)).toBe(true);
    console.log(`✅ Rehearsals API working - found ${rehearsalsResponse.data.length} rehearsals`);
  });

  test('Timeslots API should work', async () => {
    const timeslotsResponse = await makeRequest(`${apiUrl}/api/timeslots`);
    expect(timeslotsResponse.success).toBe(true);
    expect(Array.isArray(timeslotsResponse.data)).toBe(true);
    console.log(`✅ Timeslots API working - found ${timeslotsResponse.data.length} timeslots`);
  });

  test('Actors API should handle authentication correctly', async () => {
    const actorsResponse = await makeRequest(`${apiUrl}/api/actors`);
    // Should either return data or require authentication
    if (actorsResponse.success) {
      expect(Array.isArray(actorsResponse.data)).toBe(true);
      console.log(`✅ Actors API working - found ${actorsResponse.data.length} actors`);
    } else {
      expect(actorsResponse.status).toBe(401);
      console.log('ℹ️ Actors API correctly requires authentication');
    }
  });
});
