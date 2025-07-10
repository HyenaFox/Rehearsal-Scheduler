// Quick backend test
const fetch = require('node-fetch');

async function testBackend() {
  try {
    const response = await fetch('http://localhost:3000/api');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is running:', data);
    } else {
      console.log('❌ Backend responded with:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend is not running:', error.message);
    console.log('💡 Start it with: cd backend && npm start');
  }
}

testBackend();
