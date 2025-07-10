#!/usr/bin/env node
// Test runner for all backend tests

const { execSync } = require('child_process');

console.log('🧪 Running Rehearsal Scheduler Test Suite\n');

const testScripts = [
  {
    name: 'Jest Test Suite',
    command: 'npm test',
    description: 'Run all Jest tests'
  },
  {
    name: 'Backend API Test',
    command: 'node tests/test-backend-api.cjs',
    description: 'Test backend API endpoints'
  },
  {
    name: 'MongoDB Integration Test',
    command: 'node tests/test-direct-mongo-fixed.cjs',
    description: 'Test MongoDB integration'
  }
];

async function runTests() {
  for (const test of testScripts) {
    console.log(`\n🔄 Running: ${test.name}`);
    console.log(`📝 ${test.description}`);
    console.log(`💻 Command: ${test.command}\n`);
    
    try {
      execSync(test.command, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log(`✅ ${test.name} completed successfully\n`);
    } catch (error) {
      console.log(`❌ ${test.name} failed with exit code ${error.status}\n`);
    }
    
    console.log('─'.repeat(60));
  }
  
  console.log('\n🏁 Test suite completed!');
}

runTests().catch(console.error);
