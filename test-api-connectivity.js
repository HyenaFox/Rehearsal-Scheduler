// Test API connectivity for timeslots and rehearsals
const testAPI = async () => {
  const baseURL = 'http://localhost:3000/api';
  
  try {
    console.log('🧪 Testing API connectivity...');
    
    // Test 1: Get timeslots (should be public)
    console.log('\n1. Testing GET /api/timeslots...');
    const timeslotsResponse = await fetch(`${baseURL}/timeslots`);
    if (timeslotsResponse.ok) {
      const timeslots = await timeslotsResponse.json();
      console.log('✅ Timeslots API working');
      console.log(`📊 Total timeslots: ${timeslots.length}`);
      console.log('🔍 Sample timeslots:');
      timeslots.slice(0, 3).forEach((slot, i) => {
        console.log(`  ${i + 1}. ${slot.day} ${slot.startTime} (ID: ${slot.id})`);
      });
    } else {
      console.log('❌ Timeslots API failed:', timeslotsResponse.status);
    }
    
    // Test 2: Get rehearsals (should be public now)
    console.log('\n2. Testing GET /api/rehearsals...');
    const rehearsalsResponse = await fetch(`${baseURL}/rehearsals`);
    if (rehearsalsResponse.ok) {
      const rehearsals = await rehearsalsResponse.json();
      console.log('✅ Rehearsals API working');
      console.log(`📊 Total rehearsals: ${rehearsals.length}`);
      if (rehearsals.length > 0) {
        console.log('🔍 Sample rehearsals:');
        rehearsals.slice(0, 3).forEach((rehearsal, i) => {
          console.log(`  ${i + 1}. ${rehearsal.title} (ID: ${rehearsal.id})`);
        });
      }
    } else {
      console.log('❌ Rehearsals API failed:', rehearsalsResponse.status);
      const errorText = await rehearsalsResponse.text();
      console.log('Error:', errorText);
    }
    
    // Test 3: Get scenes (should be public)
    console.log('\n3. Testing GET /api/scenes...');
    const scenesResponse = await fetch(`${baseURL}/scenes`);
    if (scenesResponse.ok) {
      const scenes = await scenesResponse.json();
      console.log('✅ Scenes API working');
      console.log(`📊 Total scenes: ${scenes.length}`);
      if (scenes.length > 0) {
        console.log('🔍 Sample scenes:');
        scenes.slice(0, 3).forEach((scene, i) => {
          console.log(`  ${i + 1}. ${scene.title} (ID: ${scene._id})`);
        });
      }
    } else {
      console.log('❌ Scenes API failed:', scenesResponse.status);
    }
    
    console.log('\n✅ API connectivity test completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('🔧 Make sure the backend server is running on port 3000');
  }
};

// Run the test
testAPI();
