/**
 * Jest Unit Tests for API Backend and Google Auth
 * 
 * To run these tests:
 * 1. Install Jest: npm install --save-dev jest node-fetch
 * 2. Add to package.json scripts: "test": "jest"
 * 3. Run: npm test
 * 
 * Note: This file uses Jest globals (describe, test, expect)
 * which are available when running through Jest
 */

/* eslint-env jest */

// Mock fetch for Node.js environment
global.fetch = require('node-fetch');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const TIMEOUT = 10000;

// Helper function for API calls
async function makeApiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  
  try {
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
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: data,
      headers: response.headers
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

describe('API Backend Connectivity', () => {
  
  test('should connect to API server', async () => {
    const response = await makeApiCall('/health');
    expect(response.status).toBeGreaterThan(0);
  }, TIMEOUT);
  
  test('health check should return 200', async () => {
    const response = await makeApiCall('/health');
    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  }, TIMEOUT);
  
  test('health check should return valid data', async () => {
    const response = await makeApiCall('/health');
    expect(response.data).toBeDefined();
    expect(typeof response.data).toBe('object');
  }, TIMEOUT);
  
});

describe('Authentication Endpoints', () => {
  
  test('login endpoint should reject invalid credentials', async () => {
    const response = await makeApiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid@test.com',
        password: 'wrongpassword'
      })
    });
    
    expect([400, 401]).toContain(response.status);
  }, TIMEOUT);
  
  test('register endpoint should handle requests', async () => {
    const response = await makeApiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'jest.test@example.com',
        password: 'testpassword123',
        name: 'Jest Test User'
      })
    });
    
    // Should return 201 (created), 409 (conflict), or 400 (validation error)
    expect([201, 400, 409]).toContain(response.status);
  }, TIMEOUT);
  
  test('auth endpoints should require proper content type', async () => {
    const response = await makeApiCall('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: 'invalid data'
    });
    
    expect([400, 415]).toContain(response.status);
  }, TIMEOUT);
  
});

describe('Data Endpoints', () => {
  
  test('actors endpoint should be reachable', async () => {
    const response = await makeApiCall('/actors');
    expect(response.status).toBeGreaterThan(0);
    // Could be 200 (public) or 401 (requires auth)
    expect([200, 401]).toContain(response.status);
  }, TIMEOUT);
  
  test('timeslots endpoint should be reachable', async () => {
    const response = await makeApiCall('/timeslots');
    expect(response.status).toBeGreaterThan(0);
    expect([200, 401]).toContain(response.status);
  }, TIMEOUT);
  
  test('scenes endpoint should be reachable', async () => {
    const response = await makeApiCall('/scenes');
    expect(response.status).toBeGreaterThan(0);
    expect([200, 401]).toContain(response.status);
  }, TIMEOUT);
  
  test('successful data requests should return arrays or objects', async () => {
    const response = await makeApiCall('/actors');
    if (response.ok) {
      expect(typeof response.data).toMatch(/object|array/);
    }
  }, TIMEOUT);
  
});

describe('Google Authentication', () => {
  
  test('google auth URL endpoint should exist', async () => {
    const response = await makeApiCall('/auth/google/url');
    expect(response.status).toBeGreaterThan(0);
  }, TIMEOUT);
  
  test('google auth should return valid OAuth URL when configured', async () => {
    const response = await makeApiCall('/auth/google/url');
    
    if (response.ok && response.data && response.data.url) {
      expect(response.data.url).toContain('google');
      expect(response.data.url).toContain('oauth2');
      expect(response.data.url).toMatch(/^https?:\/\//);
    }
  }, TIMEOUT);
  
});

describe('Error Handling', () => {
  
  test('should handle invalid endpoints gracefully', async () => {
    const response = await makeApiCall('/nonexistent-endpoint');
    expect(response.status).toBe(404);
  }, TIMEOUT);
  
  test('should handle malformed JSON requests', async () => {
    const response = await makeApiCall('/auth/login', {
      method: 'POST',
      body: 'invalid json'
    });
    
    expect([400, 500]).toContain(response.status);
  }, TIMEOUT);
  
});

describe('Performance and Reliability', () => {
  
  test('API should respond within reasonable time', async () => {
    const startTime = Date.now();
    await makeApiCall('/health');
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(5000); // 5 seconds max
  }, TIMEOUT);
  
  test('API should handle multiple concurrent requests', async () => {
    const promises = Array.from({ length: 5 }, () => makeApiCall('/health'));
    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  }, TIMEOUT);
  
});

describe('Environment Configuration', () => {
  
  test('API_BASE_URL should be configured', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(API_BASE_URL.length).toBeGreaterThan(0);
    expect(API_BASE_URL).toMatch(/^https?:\/\//);
  });
  
  test('should identify environment type', () => {
    const isLocal = API_BASE_URL.includes('localhost') || 
                   API_BASE_URL.includes('127.0.0.1') ||
                   API_BASE_URL.includes('10.0.2.2');
    
    const isProduction = API_BASE_URL.includes('onrender.com') ||
                        API_BASE_URL.includes('herokuapp.com') ||
                        API_BASE_URL.includes('vercel.app');
    
    expect(isLocal || isProduction).toBe(true);
  });
  
});

// Integration test that combines multiple endpoints
describe('Integration Tests', () => {
  
  test('should handle a complete user flow simulation', async () => {
    // 1. Check health
    const healthResponse = await makeApiCall('/health');
    expect(healthResponse.ok).toBe(true);
    
    // 2. Try to access protected data
    const dataResponse = await makeApiCall('/actors');
    expect([200, 401]).toContain(dataResponse.status);
    
    // 3. Attempt authentication
    const authResponse = await makeApiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpass'
      })
    });
    expect([200, 401, 400]).toContain(authResponse.status);
    
  }, TIMEOUT * 2);
  
});

// Setup and teardown
beforeAll(() => {
  console.log('🧪 Starting Jest API tests...');
  console.log('🌐 Testing API at:', API_BASE_URL);
});

afterAll(() => {
  console.log('✅ Jest API tests completed');
});
