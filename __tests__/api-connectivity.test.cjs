// API connectivity test - Jest version
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Simple fetch implementation for Node.js
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const lib = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Node.js Test Script',
        ...options.headers
      }
    };

    const req = lib.request(requestOptions, (res) => {
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
            success: res.statusCode >= 200 && res.statusCode < 300,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            success: false,
            error: 'Invalid JSON response',
            headers: res.headers
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

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

describe('API Connectivity Tests', () => {
  const possibleUrls = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://rehearsal-scheduler-backend.onrender.com'
  ];
  
  let workingUrl = null;

  beforeAll(async () => {
    console.log('🔍 Finding accessible backend...');
    
    for (const url of possibleUrls) {
      try {
        const response = await makeRequest(`${url}/health`);
        if (response.success) {
          workingUrl = url;
          console.log(`✅ Found working backend: ${url}`);
          break;
        }
      } catch (error) {
        console.log(`❌ ${url} not accessible`);
      }
    }
  }, 30000);

  test('At least one backend URL should be accessible', () => {
    expect(workingUrl).toBeTruthy();
  });

  test('Health endpoint should return OK status', async () => {
    if (!workingUrl) {
      console.warn('No backend available for testing');
      return;
    }
    
    const response = await makeRequest(`${workingUrl}/health`);
    expect(response.success).toBe(true);
    expect(response.data.status).toBe('OK');
  });

  test('CORS headers should be present', async () => {
    if (!workingUrl) return;
    
    const response = await makeRequest(`${workingUrl}/health`);
    expect(response.headers).toHaveProperty('access-control-allow-origin');
  });

  test('API endpoints should be accessible', async () => {
    if (!workingUrl) return;
    
    const endpoints = [
      '/api/scenes',
      '/api/rehearsals', 
      '/api/timeslots'
    ];
    
    for (const endpoint of endpoints) {
      const response = await makeRequest(`${workingUrl}${endpoint}`);
      // Should either succeed or require authentication
      expect([200, 401]).toContain(response.status);
    }
  });

  test('Invalid endpoints should return 404', async () => {
    if (!workingUrl) return;
    
    const response = await makeRequest(`${workingUrl}/api/nonexistent`);
    expect(response.status).toBe(404);
  });

  test('Server should handle concurrent requests', async () => {
    if (!workingUrl) return;
    
    const requests = Array(5).fill().map(() => 
      makeRequest(`${workingUrl}/health`)
    );
    
    const responses = await Promise.all(requests);
    responses.forEach(response => {
      expect(response.success).toBe(true);
    });
  });
});
