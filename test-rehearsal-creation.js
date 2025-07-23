// Test to verify that autoscheduler creates rehearsals with proper time information
const { findBestRehearsalOpportunities, createRehearsalFromOpportunity } = require('./app/utils/autoScheduler');

console.log('🧪 Testing rehearsal creation with time information...\n');

// Mock data
const scenes = [
  {
    id: 'scene1',
    title: 'Opening Scene',
    actors: ['actor1', 'actor2'],
    estimatedDuration: 30
  }
];

const actors = [
  {
    id: 'actor1',
    name: 'John Doe',
    availability: [
      new Date('2025-07-30T13:00:00.000Z'), // 9:00 AM EST on July 30, 2025 (Wednesday)
      new Date('2025-07-30T13:30:00.000Z'), // 9:30 AM EST
    ]
  },
  {
    id: 'actor2', 
    name: 'Jane Smith',
    availability: [
      new Date('2025-07-30T13:00:00.000Z'), // 9:00 AM EST on July 30, 2025 (Wednesday)
      new Date('2025-07-30T13:30:00.000Z'), // 9:30 AM EST
    ]
  }
];

// Test finding opportunities
const opportunities = findBestRehearsalOpportunities(actors, 'wednesday', [], [], scenes);

console.log(`📊 Found ${opportunities.length} opportunities`);

if (opportunities.length > 0) {
  const firstOpportunity = opportunities[0];
  console.log('\n🎯 First opportunity details:');
  console.log('Scene:', firstOpportunity.scene.title);
  console.log('Date:', firstOpportunity.date);
  console.log('Time slot:', firstOpportunity.timeslot);
  console.log('Available actors:', firstOpportunity.actors.length);
  
  // Test creating a rehearsal from the opportunity
  const rehearsal = createRehearsalFromOpportunity(firstOpportunity);
  
  console.log('\n🎭 Created rehearsal:');
  console.log('Title:', rehearsal.title);
  console.log('Date:', rehearsal.date);
  console.log('Start time:', rehearsal.startTime);
  console.log('End time:', rehearsal.endTime);
  console.log('Actors:', rehearsal.actors.length);
  
  // Verify times are set properly
  if (rehearsal.startTime && rehearsal.endTime) {
    console.log('\n✅ SUCCESS: Rehearsal has proper start and end times!');
  } else {
    console.log('\n❌ FAILURE: Rehearsal is missing time information');
    console.log('Start time:', rehearsal.startTime);
    console.log('End time:', rehearsal.endTime);
  }
} else {
  console.log('❌ No opportunities found to test with');
}
