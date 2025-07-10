#!/usr/bin/env node

const http = require('http');
const https = require('https');
const url = require('url');

console.log('🔍 REHEARSAL SCHEDULER - BACKEND VERIFICATION SCRIPT');
console.log('=' .repeat(60));
console.log();

// Configuration
const API_CONFIGS = [
  { name: 'Port 3000', baseUrl: 'http://localhost:3000' },
  { name: 'Port 3001', baseUrl: 'http://localhost:3001' },
  { name: 'Environment Variable', baseUrl: process.env.EXPO_PUBLIC_API_URL || 'NOT_SET' }
];

const ENDPOINTS = [
  { name: 'Root', path: '/' },
  { name: 'Health', path: '/health' },
  { name: 'Scenes', path: '/api/scenes' },
  { name: 'Actors', path: '/api/actors' },
  { name: 'Rehearsals', path: '/api/rehearsals' },
  { name: 'Timeslots', path: '/api/timeslots' }
];

// Helper function to make HTTP requests
function makeRequest(fullUrl, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(fullUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Rehearsal-Scheduler-Debug/1.0'
      },
      timeout: timeout
    };

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test function for each endpoint
async function testEndpoint(baseUrl, endpoint) {
  const fullUrl = `${baseUrl}${endpoint.path}`;
  
  try {
    const result = await makeRequest(fullUrl, 3000);
    
    console.log(`   ${endpoint.name}: ${result.status === 200 ? '✅' : '❌'} (${result.status})`);
    
    if (result.status === 200 && result.data) {
      if (Array.isArray(result.data)) {
        console.log(`      📊 Array with ${result.data.length} items`);
        if (result.data.length > 0) {
          console.log(`      🔍 First item keys: ${Object.keys(result.data[0]).join(', ')}`);
        }
      } else if (typeof result.data === 'object') {
        console.log(`      📊 Object with keys: ${Object.keys(result.data).join(', ')}`);
      }
    } else if (result.status !== 200) {
      console.log(`      ❌ Error: ${result.rawData}`);
    }
    
    return result;
  } catch (error) {
    console.log(`   ${endpoint.name}: ❌ Connection failed - ${error.message}`);
    return null;
  }
}

// Main testing function
async function runTests() {
  console.log('🌐 ENVIRONMENT CHECK:');
  console.log(`   EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL || 'NOT SET'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);
  console.log();

  for (const config of API_CONFIGS) {
    if (config.baseUrl === 'NOT_SET') {
      console.log(`❌ ${config.name}: Environment variable not set`);
      continue;
    }

    console.log(`🔍 Testing ${config.name}: ${config.baseUrl}`);
    
    let workingEndpoints = 0;
    let dataEndpoints = {};
    
    for (const endpoint of ENDPOINTS) {
      const result = await testEndpoint(config.baseUrl, endpoint);
      
      if (result && result.status === 200) {
        workingEndpoints++;
        
        if (result.data && Array.isArray(result.data)) {
          dataEndpoints[endpoint.name] = result.data.length;
        }
      }
    }
    
    console.log(`   📊 Summary: ${workingEndpoints}/${ENDPOINTS.length} endpoints working`);
    
    if (Object.keys(dataEndpoints).length > 0) {
      console.log('   📈 Data counts:');
      Object.entries(dataEndpoints).forEach(([name, count]) => {
        console.log(`      ${name}: ${count} items`);
      });
    }
    
    console.log();
  }

  // Test the exact URLs that the frontend would use
  console.log('🎯 FRONTEND SIMULATION:');
  console.log('Testing exact URLs that DirectMongoService would use...');
  
  // Simulate DirectMongoService behavior
  const frontendBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
  
  console.log(`   Base URL: ${frontendBaseUrl}`);
  
  const frontendEndpoints = [
    '/api/scenes',
    '/api/actors', 
    '/api/rehearsals',
    '/api/timeslots'
  ];
  
  for (const endpoint of frontendEndpoints) {
    const fullUrl = `${frontendBaseUrl}${endpoint}`;
    console.log(`   Testing: ${fullUrl}`);
    
    try {
      const result = await makeRequest(fullUrl, 3000);
      
      if (result.status === 200) {
        console.log(`      ✅ Success: ${Array.isArray(result.data) ? result.data.length : 'N/A'} items`);
        
        if (Array.isArray(result.data) && result.data.length > 0) {
          console.log(`      🔍 Sample item: ${JSON.stringify(result.data[0], null, 2).substring(0, 200)}...`);
        }
      } else {
        console.log(`      ❌ Failed: ${result.status} - ${result.rawData}`);
      }
    } catch (error) {
      console.log(`      ❌ Error: ${error.message}`);
    }
  }
  
  console.log();
  
  // Check database directly if backend is accessible
  console.log('🗄️  DATABASE VERIFICATION:');
  console.log('Checking if backend can access database...');
  
  try {
    const healthResult = await makeRequest(`${frontendBaseUrl}/health`, 3000);
    if (healthResult && healthResult.status === 200) {
      console.log('   ✅ Backend health check passed');
      console.log(`   📊 Backend info: ${JSON.stringify(healthResult.data, null, 2)}`);
    } else {
      console.log('   ❌ Backend health check failed');
    }
  } catch (error) {
    console.log(`   ❌ Health check error: ${error.message}`);
  }
  
  console.log();
  console.log('🎯 DIAGNOSIS:');
  
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!envUrl) {
    console.log('   ❌ EXPO_PUBLIC_API_URL environment variable is not set');
  } else {
    console.log(`   ✅ Environment variable set to: ${envUrl}`);
  }
  
  console.log();
  console.log('💡 RECOMMENDATIONS:');
  console.log('1. Make sure your backend is running on the correct port');
  console.log('2. Verify your .env file has the correct EXPO_PUBLIC_API_URL');
  console.log('3. Restart your frontend with: expo start --clear');
  console.log('4. Check backend logs for any database connection issues');
  console.log('5. If using port 3001, make sure to use: start-backend-port-3001.bat');
}

// Run the tests
runTests().catch(console.error);
