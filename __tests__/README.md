# Tests Directory

This directory contains all test and debug scripts for the Rehearsal Scheduler application, organized into subdirectories for better maintainability.

## Directory Structure

### `/backend` - Backend API Tests
- `api-backend.test.js` - Comprehensive backend API test suite
- `backend-connection.test.js` - Backend connectivity tests  
- `backend-integration.test.cjs` - Backend integration tests
- `backend-simple.test.cjs` - Simple backend verification tests
- `test-backend-api.cjs` - Main backend API test script
- `test-backend-connection.js` - Legacy backend connectivity tests
- `test-backend-endpoints.js` - API endpoint tests
- `test-backend-simple.js` - Simple backend verification
- `test-backend-status.js` - Backend status checks

### `/integration` - Database & Integration Tests  
- `test-direct-mongo-fixed.cjs` - Fixed MongoDB test script
- `test-direct-mongo.js` - Direct MongoDB connection tests
- `test-directmongo-flow.js` - MongoDB data flow tests
- `test-mongo-simple.js` - Simple MongoDB tests

### `/utils` - Debug & Utility Scripts
- `debug-api-config.js` - API configuration debugging
- `simple-backend-test.js` - Simple backend test utility
- `quick-backend-test.js` - Quick backend verification
- `quokka-api-test.js` - Quokka.js API test
- `run-all-tests.js` - Test runner for all backend tests

### Root Level Tests
- `api.test.js` - Main API connectivity tests (Jest format)
- `api-and-auth.test.js` - API and authentication integration tests
- `api-connectivity.test.cjs` - API connectivity test suite
- `test-*.js` - Legacy test scripts for specific functionality

## Test Categories

### Backend API Tests
Tests that verify backend server functionality, API endpoints, and server connectivity.

### Database Tests  
Tests that verify MongoDB connection, data persistence, and database operations.

### Frontend/Component Tests
- `test-scenes-*.js` - Scene-related functionality tests
- `test-scene-actor-connection.js` - Scene-actor relationship tests
- `test-timeslot-*.js` - Timeslot functionality tests
- `test-drag-functionality.js` - Drag and drop tests
- `test-local-storage.js` - Local storage tests

### Integration Tests
- `test-api-connectivity.js` - API connectivity tests
- `test-connection.js` - General connection tests
- `test-calendar-fix.js` - Calendar integration tests
- `test-google-calendar-fix.js` - Google Calendar tests

## Running Tests

### With Jest (Recommended)
```bash
# Run all tests
npm test

# Run specific test
npm test -- test-backend-api

# Run tests in watch mode
npm test -- --watch
```

### Individual Scripts
```bash
# From the tests directory
node test-backend-api.cjs
node test-direct-mongo.js
# etc.
```

## Configuration

- `jest.config.js` - Jest configuration for the test environment
- `setup.js` - Global test setup and utilities

## Environment Variables

The tests use the following environment variables:
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Backend server port (default: 3000)
- `NODE_ENV` - Set to 'test' during testing
