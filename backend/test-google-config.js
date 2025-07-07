// Test script to verify Google Calendar OAuth configuration
// Run with: node test-google-config.js

require('dotenv').config();
const { google } = require('googleapis');

async function testGoogleConfig() {
  console.log('🧪 Testing Google Calendar OAuth Configuration...\n');

  // Check environment variables
  console.log('1. Checking environment variables:');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || clientId === 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID') {
    console.log('❌ GOOGLE_CLIENT_ID not set or using placeholder value');
    return false;
  } else {
    console.log('✅ GOOGLE_CLIENT_ID is set');
  }

  if (!clientSecret || clientSecret === 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_SECRET') {
    console.log('❌ GOOGLE_CLIENT_SECRET not set or using placeholder value');
    return false;
  } else {
    console.log('✅ GOOGLE_CLIENT_SECRET is set');
  }

  if (!redirectUri) {
    console.log('❌ GOOGLE_REDIRECT_URI not set');
    return false;
  } else {
    console.log('✅ GOOGLE_REDIRECT_URI is set:', redirectUri);
  }

  // Test OAuth client creation
  console.log('\n2. Testing OAuth client creation:');
  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    console.log('✅ OAuth2 client created successfully');

    // Test auth URL generation
    console.log('\n3. Testing auth URL generation:');
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      state: 'test-user-id'
    });
    
    console.log('✅ Auth URL generated successfully');
    console.log('📋 Test auth URL:', authUrl);
    
    console.log('\n🎉 Google Calendar OAuth configuration appears to be working!');
    console.log('\nNext steps:');
    console.log('1. Make sure this redirect URI is added to your Google Cloud Console:');
    console.log('   ' + redirectUri);
    console.log('2. Start your backend server: npm run dev');
    console.log('3. Test the integration in your app');
    
    return true;
  } catch (error) {
    console.log('❌ Error creating OAuth client:', error.message);
    return false;
  }
}

testGoogleConfig().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
});