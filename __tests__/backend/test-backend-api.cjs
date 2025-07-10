// Test backend API endpoints directly - Jest version
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

// Run the test
describe('Backend API Tests', () => {
  let workingUrl = null;

  beforeAll(async () => {
    // Try different possible API URLs
    const possibleUrls = [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://rehearsal-scheduler-backend.onrender.com'
    ];
    
    // Test which URL works
    console.log('🔍 Checking which backend URL is accessible...');
    for (const baseUrl of possibleUrls) {
      try {
        console.log(`  Testing: ${baseUrl}`);
        const response = await makeRequest(`${baseUrl}/health`);
        if (response.success) {
          console.log(`  ✅ ${baseUrl} is accessible`);
          workingUrl = baseUrl;
          break;
        } else {
          console.log(`  ❌ ${baseUrl} returned status ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ ${baseUrl} failed: ${error.error}`);
      }
    }
    
    if (!workingUrl) {
      throw new Error('No backend server found running! Please start your backend server first.');
    }
    
    console.log(`\n✅ Using backend URL: ${workingUrl}\n`);
  }, 30000);

  test('Health Check endpoint should be accessible', async () => {
    expect(workingUrl).toBeTruthy();
    const response = await makeRequest(`${workingUrl}/health`);
    expect(response.success).toBe(true);
    expect(response.data.status).toBe('OK');
  });

  test('Scenes endpoint should return data', async () => {
    const response = await makeRequest(`${workingUrl}/api/scenes`);
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    console.log(`  ✅ Scenes: Found ${response.data.length} items`);
  });

  test('Rehearsals endpoint should return data', async () => {
    const response = await makeRequest(`${workingUrl}/api/rehearsals`);
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    console.log(`  ✅ Rehearsals: Found ${response.data.length} items`);
  });

  test('Timeslots endpoint should return data', async () => {
    const response = await makeRequest(`${workingUrl}/api/timeslots`);
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
    console.log(`  ✅ Timeslots: Found ${response.data.length} items`);
  });

  test('Actors endpoint should handle authentication', async () => {
    const response = await makeRequest(`${workingUrl}/api/actors`);
    // This endpoint requires authentication, so we expect either success or 401
    expect([200, 401]).toContain(response.status);
    if (response.status === 401) {
      expect(response.data.error).toBe('Access token required');
      console.log('  ℹ️ Actors endpoint correctly requires authentication');
    } else {
      expect(Array.isArray(response.data)).toBe(true);
      console.log(`  ✅ Actors: Found ${response.data.length} items`);
    }
  });
});
