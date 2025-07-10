// Simple test for backend API integration
import dotenv from 'dotenv';
import DirectMongoService from './app/services/directMongo.js';

// Load environment variables
dotenv.config();

async function testBackendConnection() {
  console.log('🧪 Testing Backend API Connection...');
  
  // Check if API URL is configured
  let apiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!apiUrl) {
    console.log('⚠️  No EXPO_PUBLIC_API_URL in .env file, using localhost');
    apiUrl = 'http://localhost:3000';
  }
  
  console.log(`🔗 Using API URL: ${apiUrl}`);
  
  // Update the service to use the correct URL for testing
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = apiUrl;
  
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
