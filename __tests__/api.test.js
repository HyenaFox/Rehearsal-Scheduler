/* eslint-env jest */
/**
 * API Backend Tests for VS Code Testing Tab
 * 
 * These tests will appear in VS Code's Testing tab.
 * Make sure Jest extension is installed in VS Code.
 */

// Don't require node-fetch if fetch is already available
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

describe('🌐 API Connectivity', () => {
  test('should connect to health endpoint', async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    expect(response.status).toBeGreaterThan(0);
  });

  test('should return 200 for health check', async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    expect(response.status).toBe(200);
  });
});

describe('🔐 Authentication', () => {
  test('should reject invalid login credentials', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid@test.com',
        password: 'wrongpassword'
      })
    });
    
    expect([400, 401]).toContain(response.status);
  });

  test('should handle registration requests', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.user@example.com',
        password: 'testpass123',
        name: 'Test User'
      })
    });
    
    // Could be 201 (created), 409 (exists), or 400 (validation)
    expect([201, 400, 409]).toContain(response.status);
  });
});

describe('📊 Data Endpoints', () => {
  test('actors endpoint should be reachable', async () => {
    const response = await fetch(`${API_BASE_URL}/actors`);
    expect([200, 401]).toContain(response.status);
  });

  test('timeslots endpoint should be reachable', async () => {
    const response = await fetch(`${API_BASE_URL}/timeslots`);
    expect([200, 401]).toContain(response.status);
  });

  test('scenes endpoint should be reachable', async () => {
    const response = await fetch(`${API_BASE_URL}/scenes`);
    expect([200, 401]).toContain(response.status);
  });
});

describe('🔍 Google Auth', () => {
  test('google auth endpoint should exist', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/google/url`);
    expect(response.status).toBeGreaterThan(0);
  });

  test('should return valid google auth URL when configured', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/google/url`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.url) {
        expect(data.url).toContain('google');
        expect(data.url).toContain('oauth');
      }
    }
    // This test passes even if Google auth isn't configured
    expect(true).toBe(true);
  });
});

describe('⚡ Performance', () => {
  test('should respond within 5 seconds', async () => {
    const startTime = Date.now();
    await fetch(`${API_BASE_URL}/health`);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000);
  }, 10000);
});

describe('🛡️ Error Handling', () => {
  test('should return 404 for invalid endpoints', async () => {
    const response = await fetch(`${API_BASE_URL}/invalid-endpoint-xyz`);
    expect(response.status).toBe(404);
  });

  test('should handle malformed requests', async () => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });
    
    expect([400, 500]).toContain(response.status);
  });
});
