require('dotenv').config();
const axios = require('axios');

async function testCalendarImport() {
  try {
    console.log('🧪 Testing Google Calendar Import Functionality');
    console.log('===============================================');
    
    const baseURL = 'http://localhost:3000/api';
    
    // First, test the available slots endpoint
    console.log('📋 Checking available timeslots from WeeklyAvailability...');
    
    const slotsResponse = await axios.get(`${baseURL}/calendar/available-slots`);
    console.log('✅ Available Slots Response:', {
      status: slotsResponse.status,
      slotsCount: slotsResponse.data.length,
      firstFewSlots: slotsResponse.data.slice(0, 5)
    });
    
    console.log('\n📊 Total slots available:', slotsResponse.data.length);
    
    // Group by day to see the distribution
    const dayGroups = {};
    slotsResponse.data.forEach(slot => {
      const day = slot.dayOfWeek;
      dayGroups[day] = (dayGroups[day] || 0) + 1;
    });
    
    console.log('📊 Slots per day:', dayGroups);
    
    // Now test the import endpoint (will fail auth but that's okay)
    console.log('\n� Testing import-availability endpoint (expect auth failure)...');
    const testUserId = 'test-user-123';
    
    const response = await axios.get(`${baseURL}/calendar/import-availability?userId=${testUserId}&accessToken=dummy-token-for-testing`);
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('📊 Response Status:', error.response.status);
      console.log('📊 Response Data:', error.response.data);
      
      // Even if auth fails, we can see if timeslots are being generated properly
      if (error.response.data && error.response.data.debug) {
        console.log('🔍 Debug Info:', error.response.data.debug);
      }
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

testCalendarImport();
