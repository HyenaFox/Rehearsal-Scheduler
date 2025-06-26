console.log('🧪 Simple Google Calendar Test');
console.log('==============================');

try {
  const GoogleCalendarService = require('./src/services/googleCalendar');
  console.log('✅ GoogleCalendarService loaded successfully');
  
  const service = new GoogleCalendarService();
  console.log('✅ Service instance created');
  
  // Test timeslot
  const testTimeslot = {
    id: 'mon-2pm-4pm', 
    label: 'Mon, 2:00 PM - 4:00 PM', 
    day: 'Monday', 
    startTime: '2:00 PM', 
    endTime: '4:00 PM'
  };
  
  // Mock busy period (Monday 2:30 PM - 3:30 PM)
  const busyPeriods = [{
    start: new Date('2025-06-30T14:30:00'),
    end: new Date('2025-06-30T15:30:00'),
    summary: 'Test Meeting'
  }];
  
  console.log('🧪 Testing single timeslot check...');
  const result = service.checkSingleTimeslotAvailability(testTimeslot, busyPeriods, 7);
  
  console.log('📊 Results:');
  console.log(`  Timeslot: ${result.label}`);
  console.log(`  Available: ${result.isAvailable ? '✅ YES' : '❌ NO'}`);
  console.log(`  Availability: ${Math.round(result.availability * 100)}%`);
  console.log(`  Total days in range: ${result.totalDays}`);
  console.log(`  Available days: ${result.totalAvailableDays}`);
  console.log(`  Conflicts: ${result.conflicts.length}`);
  
  if (result.conflicts.length > 0) {
    console.log('  Conflict details:');
    result.conflicts.forEach(conflict => {
      console.log(`    ${conflict.date}: ${conflict.conflictingEvents.map(e => e.summary).join(', ')}`);
    });
  }
  
  console.log('\n✅ Test completed successfully!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n🎯 How this works in the app:');
console.log('1. User connects Google Calendar via OAuth');
console.log('2. App calls /api/calendar/check-timeslots with rehearsal timeslots');
console.log('3. Backend fetches calendar events and checks for conflicts');
console.log('4. Backend automatically updates user availability');
console.log('5. User is marked available/unavailable based on calendar conflicts');
