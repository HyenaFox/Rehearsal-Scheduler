const http = require('http');
const url = require('url');

console.log('🔍 BACKEND DATA VERIFICATION');
console.log('=' .repeat(50));
console.log();

// Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
console.log(`📡 Testing API: ${API_URL}`);
console.log();

// Parse the URL
const parsedUrl = url.parse(API_URL);

// Test endpoints
const endpoints = [
  { name: 'Root', path: '/' },
  { name: 'Health', path: '/health' },
  { name: 'Scenes', path: '/api/scenes' },
  { name: 'Actors', path: '/api/actors' },
  { name: 'Rehearsals', path: '/api/rehearsals' },
  { name: 'Timeslots', path: '/api/timeslots' }
];

function testEndpoint(name, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: path,
      method: 'GET',
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log(`🔍 Testing ${name} (${path})...`);

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const jsonData = JSON.parse(data);
            
            if (Array.isArray(jsonData)) {
              console.log(`   ✅ SUCCESS: ${jsonData.length} items`);
              if (jsonData.length > 0 && name !== 'Root' && name !== 'Health') {
                console.log(`   📄 Sample: ${JSON.stringify(jsonData[0], null, 2).substring(0, 150)}...`);
              }
            } else {
              console.log(`   ✅ SUCCESS: ${res.statusCode}`);
              if (name === 'Health' || name === 'Root') {
                console.log(`   📄 Response: ${JSON.stringify(jsonData, null, 2).substring(0, 200)}`);
              }
            }
          } else {
            console.log(`   ❌ ERROR: ${res.statusCode} - ${data.substring(0, 100)}`);
          }
        } catch (error) {
          console.log(`   ❌ PARSE ERROR: ${res.statusCode} - ${data.substring(0, 100)}`);
        }
        
        console.log();
        resolve({
          name,
          status: res.statusCode,
          data: data,
          success: res.statusCode === 200
        });
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ CONNECTION ERROR: ${error.message}`);
      console.log();
      resolve({
        name,
        status: 0,
        error: error.message,
        success: false
      });
    });

    req.on('timeout', () => {
      console.log(`   ❌ TIMEOUT: Request took too long`);
      console.log();
      req.destroy();
      resolve({
        name,
        status: 0,
        error: 'timeout',
        success: false
      });
    });

    req.end();
  });
}

async function runAllTests() {
  console.log('🚀 Starting endpoint tests...\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.path);
    results.push(result);
  }
  
  console.log('📊 SUMMARY:');
  console.log('=' .repeat(30));
  
  let successCount = 0;
  let dataEndpoints = 0;
  let totalItems = 0;
  
  results.forEach(result => {
    if (result.success) {
      successCount++;
      console.log(`✅ ${result.name}: Working`);
      
      // Count data items for data endpoints
      if (['Scenes', 'Actors', 'Rehearsals', 'Timeslots'].includes(result.name)) {
        try {
          const data = JSON.parse(result.data);
          if (Array.isArray(data)) {
            dataEndpoints++;
            totalItems += data.length;
            console.log(`   📊 ${data.length} items`);
          }
        } catch (e) {
          // Ignore parse errors for summary
        }
      }
    } else {
      console.log(`❌ ${result.name}: Failed (${result.error || result.status})`);
    }
  });
  
  console.log();
  console.log(`🎯 Results: ${successCount}/${results.length} endpoints working`);
  console.log(`📈 Total data items: ${totalItems}`);
  
  if (totalItems === 0 && successCount >= 4) {
    console.log();
    console.log('⚠️  WARNING: Backend is working but database appears empty!');
    console.log('💡 Solutions:');
    console.log('   1. Run: node populate-test-data.js');
    console.log('   2. Check backend database connection');
    console.log('   3. Verify MongoDB has data');
  } else if (successCount < 2) {
    console.log();
    console.log('❌ CRITICAL: Backend server issues detected!');
    console.log('💡 Solutions:');
    console.log('   1. Start backend: start-backend-port-3001.bat');
    console.log('   2. Check backend logs for errors');
    console.log('   3. Verify port 3001 is available');
  } else if (totalItems > 0) {
    console.log();
    console.log('✅ SUCCESS: Backend is working and has data!');
    console.log('💡 If frontend still shows no data:');
    console.log('   1. Clear frontend cache: expo start --clear');
    console.log('   2. Check browser network tab for API calls');
    console.log('   3. Verify frontend is using correct API URL');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error.message);
});
