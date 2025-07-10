/**
 * Quick Connection Test
 * Run this to test if your backend is accessible
 */

console.log('🔍 Testing backend connection...');

// Test both ports to see which one works
const testPorts = [3000, 3001];

async function testConnection(port) {
  try {
    console.log(`\n📡 Testing port ${port}...`);
    
    const response = await fetch(`http://localhost:${port}/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Port ${port} is working!`);
      console.log(`📊 Response:`, data);
      return true;
    } else {
      console.log(`❌ Port ${port} returned status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`💥 Port ${port} failed: ${error.message}`);
    return false;
  }
}

async function findWorkingPort() {
  console.log('🔍 Searching for working backend port...');
  
  for (const port of testPorts) {
    const isWorking = await testConnection(port);
    if (isWorking) {
      console.log(`\n🎯 Found working backend on port ${port}`);
      console.log(`🔧 Update your .env file:`);
      console.log(`EXPO_PUBLIC_API_URL=http://localhost:${port}/api`);
      return port;
    }
  }
  
  console.log('\n❌ No working backend found on common ports');
  console.log('🔧 Make sure your backend is running with: npm run backend');
  return null;
}

// Run the test
findWorkingPort().then(port => {
  if (port) {
    console.log(`\n✨ Backend is ready on port ${port}!`);
  } else {
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Make sure backend is running: npm run backend');
    console.log('2. Check backend logs for the actual port');
    console.log('3. Update EXPO_PUBLIC_API_URL in .env file');
  }
});
