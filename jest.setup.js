/* eslint-env jest */
// Jest setup file
// This file runs before each test suite

// Mock node-fetch for tests
global.fetch = require('node-fetch');

// Increase timeout for API tests
jest.setTimeout(15000);

// Mock environment variables
process.env.EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Global test utilities
global.testUtils = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000
};
