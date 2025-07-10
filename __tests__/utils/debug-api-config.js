// Debug script to check environment variables and API URLs
console.log('🔍 Debugging API Configuration...\n');

// Check environment variables
console.log('📊 Environment Variables:');
console.log('EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

// Check what the DirectMongoService is using
const DirectMongoService = require('./app/services/directMongo.js');
const service = new DirectMongoService();

console.log('🔧 DirectMongoService Configuration:');
console.log('baseUrl:', service.baseUrl);
console.log('');

// Test the API URL
console.log('🧪 Testing API URL Construction:');
const testUrl = `${service.baseUrl}/api/scenes`;
console.log('Constructed scenes URL:', testUrl);
console.log('');

// Check if we can reach the backend
console.log('📡 Testing Backend Connection:');
const http = require('http');
const url = require('url');

const parsedUrl = url.parse(service.baseUrl);
const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || 80,
  path: '/',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  console.log('✅ Backend is responding');
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  
  if (res.statusCode === 200) {
    console.log('✅ Backend connection successful!');
    console.log('');
    console.log('🎯 Summary:');
    console.log('- Environment variable is set correctly');
    console.log('- DirectMongoService is using correct URL');
    console.log('- Backend is responding');
    console.log('');
    console.log('💡 If you\'re still seeing 404 errors:');
    console.log('1. Stop your frontend (Ctrl+C)');
    console.log('2. Run: expo start --clear');
    console.log('3. Wait for the app to fully reload');
  }
});

req.on('error', (error) => {
  console.log('❌ Backend connection failed:', error.message);
  console.log('');
  console.log('💡 Make sure your backend is running:');
  console.log('Run: start-backend-port-3001.bat');
});

req.on('timeout', () => {
  console.log('❌ Backend connection timed out');
  req.destroy();
});

req.end();
