const axios = require('axios');

// Test backend connection
async function testBackendConnection() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🔍 Testing backend connection...\n');
  
  try {
    // Test basic API endpoint
    console.log('Testing basic API endpoint...');
    const response = await axios.get(`${baseUrl}/api`, {
      timeout: 5000
    });
    
    console.log('✅ Backend API is responding');
    console.log('Response:', response.data);
    
    // Test scenes endpoint
    console.log('\nTesting scenes endpoint...');
    const scenesResponse = await axios.get(`${baseUrl}/api/scenes`, {
      timeout: 5000
    });
    
    console.log('✅ Scenes endpoint is working');
    console.log('Number of scenes:', scenesResponse.data.length);
    
    // Test actors endpoint
    console.log('\nTesting actors endpoint...');
    const actorsResponse = await axios.get(`${baseUrl}/api/actors`, {
      timeout: 5000
    });
    
    console.log('✅ Actors endpoint is working');
    console.log('Number of actors:', actorsResponse.data.length);
    
    // Test timeslots endpoint
    console.log('\nTesting timeslots endpoint...');
    const timeslotsResponse = await axios.get(`${baseUrl}/api/timeslots`, {
      timeout: 5000
    });
    
    console.log('✅ Timeslots endpoint is working');
    console.log('Number of timeslots:', timeslotsResponse.data.length);
    
    // Test rehearsals endpoint
    console.log('\nTesting rehearsals endpoint...');
    const rehearsalsResponse = await axios.get(`${baseUrl}/api/rehearsals`, {
      timeout: 5000
    });
    
    console.log('✅ Rehearsals endpoint is working');
    console.log('Number of rehearsals:', rehearsalsResponse.data.length);
    
    console.log('\n🎉 All backend endpoints are working correctly!');
    console.log('✅ Your app should now be able to load data from the database.');
    
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: Make sure the backend server is running!');
      console.log('   Run: cd backend && npm start');
    } else if (error.code === 'ECONNRESET') {
      console.log('\n💡 Solution: The backend server may be starting up. Wait a moment and try again.');
    } else {
      console.log('\n💡 Check the backend server logs for more details.');
    }
  }
}

// Run the test
testBackendConnection();
