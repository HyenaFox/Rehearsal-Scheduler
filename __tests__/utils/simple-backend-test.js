const http = require('http');
const url = require('url');

console.log('🔍 SIMPLE BACKEND VERIFICATION');
console.log('Testing backend data endpoints...\n');

// Test configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
console.log(`📡 Using API URL: ${API_URL}\n`);

// Parse URL
const parsedUrl = url.parse(API_URL);

// Test endpoints
const endpoints = [
  { name: 'Health Check', path: '/health' },
  { name: 'Scenes', path: '/api/scenes' },
  { name: 'Actors', path: '/api/actors' },
  { name: 'Rehearsals', path: '/api/rehearsals' },
  { name: 'Timeslots', path: '/api/timeslots' }
];

async function testEndpoint(name, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: path,
      method: 'GET',
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ ${name}: ${res.statusCode} - ${Array.isArray(jsonData) ? jsonData.length : 'N/A'} items`);
          
          if (Array.isArray(jsonData) && jsonData.length > 0) {
            console.log(`   📋 Sample: ${JSON.stringify(jsonData[0], null, 2).substring(0, 150)}...`);
          } else if (jsonData && typeof jsonData === 'object') {
            console.log(`   📋 Response: ${JSON.stringify(jsonData, null, 2).substring(0, 150)}...`);
          }
        } catch (error) {
          console.log(`❌ ${name}: ${res.statusCode} - Parse error: ${data.substring(0, 100)}`);
        }
        console.log();
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${name}: Connection failed - ${error.message}\n`);
      resolve();
    });

    req.on('timeout', () => {
      console.log(`❌ ${name}: Request timeout\n`);
      req.destroy();
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.name, endpoint.path);
  }
  
  console.log('🎯 DIAGNOSIS:');
  console.log('If all endpoints show 0 items, the database might be empty or not connected.');
  console.log('If you see connection errors, make sure your backend is running.');
  console.log('If you see 404 errors, check your API routes.');
  console.log('\n💡 Next steps:');
  console.log('1. Check if backend server is running');
  console.log('2. Verify MongoDB connection');
  console.log('3. Check if database has data');
  console.log('4. Verify API routes are working');
}

runTests();
