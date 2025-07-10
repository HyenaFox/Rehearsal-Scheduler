const http = require('http');

console.log('🔍 Testing backend server connectivity...\n');

// Test if backend server is running
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Backend server is running!');
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Backend API info:', jsonData.name);
      console.log('✅ Version:', jsonData.version);
      console.log('✅ Status:', jsonData.status);
      console.log('\n🎉 Backend server is working correctly!');
      console.log('📱 Your frontend app should now be able to load data.');
    } catch (error) {
      console.log('📄 Backend response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Backend server is not running or not responding');
  console.log('Error:', error.message);
  console.log('\n💡 To fix this issue:');
  console.log('1. Open a new terminal/command prompt');
  console.log('2. Navigate to the backend directory: cd backend');
  console.log('3. Start the server: npm start');
  console.log('4. Wait for "✅ Connected to MongoDB successfully" message');
  console.log('5. Then refresh your frontend app');
  console.log('\n📝 Or use the batch file: start-backend.bat');
});

req.on('timeout', () => {
  console.log('❌ Backend server connection timed out');
  console.log('\n💡 The server may be starting up. Please wait a moment and try again.');
  req.destroy();
});

req.end();
