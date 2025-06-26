const GoogleCalendarService = require('./src/services/googleCalendar');

// Test data - sample timeslots from the app
const testTimeslots = [
  { id: 'mon-2pm-4pm', label: 'Mon, 2:00 PM - 4:00 PM', day: 'Monday', startTime: '2:00 PM', endTime: '4:00 PM' },
  { id: 'tue-3pm-5pm', label: 'Tue, 3:00 PM - 5:00 PM', day: 'Tuesday', startTime: '3:00 PM', endTime: '5:00 PM' },
  { id: 'wed-10am-1pm', label: 'Wed, 10:00 AM - 1:00 PM', day: 'Wednesday', startTime: '10:00 AM', endTime: '1:00 PM' },
];

// Test busy periods (simulating Google Calendar events)
const testBusyPeriods = [
  {
    start: new Date('2025-06-30T14:30:00'), // Monday 2:30 PM
    end: new Date('2025-06-30T15:30:00'),   // Monday 3:30 PM
    summary: 'Team Meeting'
  },
  {
    start: new Date('2025-07-01T15:00:00'), // Tuesday 3:00 PM
    end: new Date('2025-07-01T16:00:00'),   // Tuesday 4:00 PM
    summary: 'Doctor Appointment'
  }
];

async function testTimeslotAvailability() {
  console.log('🧪 Testing timeslot availability checker...');
  
  const googleCalendar = new GoogleCalendarService();
  
  // Test each timeslot
  testTimeslots.forEach((timeslot, index) => {
    console.log(`\n📅 Testing timeslot ${index + 1}: ${timeslot.label}`);
    
    const result = googleCalendar.checkSingleTimeslotAvailability(timeslot, testBusyPeriods, 7);
    
    console.log(`   ✅ Available: ${result.isAvailable}`);
    console.log(`   📊 Availability: ${(result.availability * 100).toFixed(1)}%`);
    console.log(`   📅 Total days: ${result.totalDays}`);
    console.log(`   🟢 Available days: ${result.totalAvailableDays}`);
    
    if (result.conflicts.length > 0) {
      console.log(`   ⚠️  Conflicts: ${result.conflicts.length}`);
      result.conflicts.forEach(conflict => {
        console.log(`      - ${conflict.date}: ${conflict.conflictingEvents.length} events`);
      });
    }
    
    if (result.nextAvailableDate) {
      console.log(`   📅 Next available: ${result.nextAvailableDate}`);
    }
  });
  
  console.log('\n🎉 Test completed!');
}

// Run the test
testTimeslotAvailability().catch(console.error);
