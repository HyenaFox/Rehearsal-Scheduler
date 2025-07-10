// Simple test for backend API integration
import dotenv from 'dotenv';
import DirectMongoService from './app/services/directMongo.js';

// Load environment variables
dotenv.config();

async function testBackendConnection() {
  console.log('🧪 Testing Backend API Connection...');
  
  // Check if API URL is configured
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    console.log('❌ Missing EXPO_PUBLIC_API_URL in .env file');
    console.log('Please set it to your backend URL (e.g., https://rehearsal-scheduler-backend.onrender.com)');
    return;
  }
  
  console.log(`🔗 Using API URL: ${apiUrl}`);
  
  try {
    // Test connection
    console.log('1. Testing backend connection...');
    const result = await DirectMongoService.testConnection();
    if (result.success) {
      console.log('✅ Backend connection successful');
    } else {
      console.log('❌ Backend connection failed:', result.message);
      return;
    }
    
    // Test getting scenes
    console.log('2. Testing scenes API...');
    const scenes = await DirectMongoService.getAllScenes();
    console.log(`✅ Scenes API working - found ${scenes.length} scenes`);
    
    // Test getting actors
    console.log('3. Testing actors API...');
    const actors = await DirectMongoService.getAllActors();
    console.log(`✅ Actors API working - found ${actors.length} actors`);
    
    // Test getting rehearsals
    console.log('4. Testing rehearsals API...');
    const rehearsals = await DirectMongoService.getAllRehearsals();
    console.log(`✅ Rehearsals API working - found ${rehearsals.length} rehearsals`);
    
    // Test getting timeslots
    console.log('5. Testing timeslots API...');
    const timeslots = await DirectMongoService.getAllTimeslots();
    console.log(`✅ Timeslots API working - found ${timeslots.length} timeslots`);
    
    console.log('\n🎉 All backend API tests passed!');
    console.log('✅ Your app is ready to use the backend API');
    
  } catch (error) {
    console.log('❌ Backend API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure your backend server is running');
    console.log('- Check the API URL in your .env file');
    console.log('- Verify your MongoDB connection in the backend');
    console.log('- Check backend logs for errors');
  }
}

testBackendConnection();
    
    // Test timeslots generation
    console.log('2. Testing timeslots generation...');
    const timeslots = DirectMongoService.generateAllTimeslots();
    console.log(`✅ Generated ${timeslots.length} timeslots`);
    
    // Test scenes (should work with local fallback)
    console.log('3. Testing scenes...');
    const scenes = await DirectMongoService.getAllScenes();
    console.log(`✅ Retrieved ${scenes.length} scenes`);
    
    // Test actors (should work with local fallback)
    console.log('4. Testing actors...');
    const actors = await DirectMongoService.getAllActors();
    console.log(`✅ Retrieved ${actors.length} actors`);
    
    // Test rehearsals (should work with local fallback)
    console.log('5. Testing rehearsals...');
    const rehearsals = await DirectMongoService.getAllRehearsals();
    console.log(`✅ Retrieved ${rehearsals.length} rehearsals`);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectMongo();
