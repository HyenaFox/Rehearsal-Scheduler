// Jest configuration for Rehearsal Scheduler tests
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: [
    '<rootDir>/__tests__/**/*.test.js',
    '<rootDir>/__tests__/**/*.test.cjs',
    '<rootDir>/__tests__/test-*.js',
    '<rootDir>/__tests__/test-*.cjs',
    '<rootDir>/__tests__/**/test-*.js',
    '<rootDir>/__tests__/**/test-*.cjs'
  ],
  moduleFileExtensions: ['js', 'cjs', 'json'],
  transform: {},
  testTimeout: 30000,
  collectCoverageFrom: [
    'app/**/*.{js,ts,tsx}',
    'backend/src/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/build-*/',
    '/dist/'
  ],
  verbose: true,
  displayName: 'Rehearsal Scheduler Tests'
};
