// Jest setup file for the tests
// This file is executed before each test file

// Set up global variables for testing
global.testEnv = 'jest';

// Common test utilities
global.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://blazemurphy:RdKgzKIGY7AhQZJ7@cluster0.w0u3z.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority&appName=Cluster0';
process.env.PORT = process.env.PORT || '3000';

console.log('Test environment initialized');
