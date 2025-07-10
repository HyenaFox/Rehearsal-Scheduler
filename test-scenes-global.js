// Test script to verify global scenes system is working
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function testScenesGlobal() {
  try {
    console.log('🎭 Testing global scenes system...');
    
    // Test 1: Get all scenes (should work without authentication)
    console.log('\n1. Testing GET /api/scenes (public access)...');
    const response = await fetch(`${API_BASE_URL}/scenes`);
    
    if (response.ok) {
      const scenes = await response.json();
      console.log('✅ Successfully fetched scenes');
      console.log(`📊 Total scenes: ${scenes.length}`);
      
      if (scenes.length > 0) {
        console.log('\n📝 Scene details:');
        scenes.forEach((scene, index) => {
          console.log(`  ${index + 1}. ${scene.title || scene.name}`);
          console.log(`     ID: ${scene._id}`);
          console.log(`     Created By: ${scene.createdBy || 'Not specified'}`);
          console.log(`     Description: ${scene.description || 'No description'}`);
          console.log(`     Priority: ${scene.priority || 5}`);
          console.log('');
        });
      } else {
        console.log('📭 No scenes found in the database');
      }
    } else {
      console.log('❌ Failed to fetch scenes');
      console.log('Status:', response.status);
      console.log('Response:', await response.text());
    }
    
    // Test 2: Check if server is responding
    console.log('\n2. Testing server health...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Server is healthy');
    } else {
      console.log('⚠️  Server health check failed');
    }
    
  } catch (error) {
    console.error('❌ Error testing scenes:', error.message);
    console.log('🔧 Make sure the backend server is running on port 3000');
  }
}

// Run the test
testScenesGlobal();
