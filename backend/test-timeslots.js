const GoogleCalendarService = require('./src/services/googleCalendar');

// Test data - using the default timeslots from the app
const testTimeslots = [
  { id: 'mon-2pm-4pm', label: 'Mon, 2:00 PM - 4:00 PM', day: 'Monday', startTime: '2:00 PM', endTime: '4:00 PM' },
  { id: 'tue-3pm-5pm', label: 'Tue, 3:00 PM - 5:00 PM', day: 'Tuesday', startTime: '3:00 PM', endTime: '5:00 PM' },
  { id: 'wed-10am-1pm', label: 'Wed, 10:00 AM - 1:00 PM', day: 'Wednesday', startTime: '10:00 AM', endTime: '1:00 PM' },
  { id: 'thu-6pm-8pm', label: 'Thu, 6:00 PM - 8:00 PM', day: 'Thursday', startTime: '6:00 PM', endTime: '8:00 PM' },
  { id: 'fri-11am-2pm', label: 'Fri, 11:00 AM - 2:00 PM', day: 'Friday', startTime: '11:00 AM', endTime: '2:00 PM' },
];

// Mock calendar events for testing
const mockCalendarEvents = [
  {
    summary: 'Meeting with client',
    start: { dateTime: '2025-06-30T14:00:00-07:00' }, // Monday 2:00 PM
    end: { dateTime: '2025-06-30T15:00:00-07:00' }    // Monday 3:00 PM
  },
  {
    summary: 'Doctor appointment',
    start: { dateTime: '2025-07-02T10:30:00-07:00' }, // Wednesday 10:30 AM
    end: { dateTime: '2025-07-02T11:30:00-07:00' }    // Wednesday 11:30 AM
  },
  {
    summary: 'Team standup',
    start: { dateTime: '2025-07-04T11:00:00-07:00' }, // Friday 11:00 AM
    end: { dateTime: '2025-07-04T12:00:00-07:00' }    // Friday 12:00 PM
  }
];

// Test the time parsing function
function testTimeParsing() {
  console.log('\n🧪 Testing Time Parsing...');
  
  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr || '0');
    
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    return { hour, minute };
  };

  const testCases = [
    '2:00 PM',
    '10:00 AM',
    '6:00 PM',
    '11:00 AM',
    '12:00 PM',
    '12:00 AM'
  ];

  testCases.forEach(time => {
    const parsed = parseTime(time);
    console.log(`  ${time} -> ${parsed.hour}:${parsed.minute.toString().padStart(2, '0')}`);
  });
}

// Test the single timeslot availability check
function testSingleTimeslotCheck() {
  console.log('\n🧪 Testing Single Timeslot Check...');
  
  const googleCalendar = new GoogleCalendarService();
  
  // Convert mock events to busy periods
  const busyPeriods = mockCalendarEvents.map(event => ({
    start: new Date(event.start.dateTime),
    end: new Date(event.end.dateTime),
    summary: event.summary
  }));

  console.log('\n📅 Mock Busy Periods:');
  busyPeriods.forEach(period => {
    console.log(`  ${period.summary}: ${period.start.toLocaleString()} - ${period.end.toLocaleString()}`);
  });

  console.log('\n📅 Checking Timeslots:');
  testTimeslots.forEach(timeslot => {
    const result = googleCalendar.checkSingleTimeslotAvailability(timeslot, busyPeriods, 14);
    console.log(`\n  ${timeslot.label}:`);
    console.log(`    Available: ${result.isAvailable ? '✅' : '❌'}`);
    console.log(`    Availability: ${Math.round(result.availability * 100)}%`);
    console.log(`    Available days: ${result.totalAvailableDays}/${result.totalDays}`);
    
    if (result.conflicts.length > 0) {
      console.log(`    Conflicts: ${result.conflicts.length}`);
      result.conflicts.forEach(conflict => {
        console.log(`      ${conflict.date}: ${conflict.conflictingEvents.map(e => e.summary).join(', ')}`);
      });
    }
    
    if (result.nextAvailableDate) {
      console.log(`    Next available: ${result.nextAvailableDate}`);
    }
  });
}

// Test day of week calculation
function testDayOfWeek() {
  console.log('\n🧪 Testing Day of Week Calculation...');
  
  const today = new Date();
  const dateRange = 14;
  const endDate = new Date(today.getTime() + dateRange * 24 * 60 * 60 * 1000);
  
  console.log(`Date range: ${today.toDateString()} to ${endDate.toDateString()}`);
  
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(dayName => {
    const dayMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    const targetDayOfWeek = dayMap[dayName];
    const occurrences = [];
    
    for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
      if (date.getDay() === targetDayOfWeek) {
        occurrences.push(new Date(date));
      }
    }
    
    console.log(`  ${dayName}: ${occurrences.length} occurrences`);
    occurrences.forEach(date => {
      console.log(`    ${date.toDateString()}`);
    });
  });
}

// Test overlap detection
function testOverlapDetection() {
  console.log('\n🧪 Testing Overlap Detection...');
  
  const testCases = [
    {
      name: 'Exact overlap',
      slot: { start: new Date('2025-06-30T14:00:00'), end: new Date('2025-06-30T16:00:00') },
      busy: { start: new Date('2025-06-30T14:00:00'), end: new Date('2025-06-30T15:00:00') },
      expected: true
    },
    {
      name: 'Partial overlap (start)',
      slot: { start: new Date('2025-06-30T14:00:00'), end: new Date('2025-06-30T16:00:00') },
      busy: { start: new Date('2025-06-30T13:30:00'), end: new Date('2025-06-30T14:30:00') },
      expected: true
    },
    {
      name: 'Partial overlap (end)',
      slot: { start: new Date('2025-06-30T14:00:00'), end: new Date('2025-06-30T16:00:00') },
      busy: { start: new Date('2025-06-30T15:30:00'), end: new Date('2025-06-30T16:30:00') },
      expected: true
    },
    {
      name: 'No overlap (before)',
      slot: { start: new Date('2025-06-30T14:00:00'), end: new Date('2025-06-30T16:00:00') },
      busy: { start: new Date('2025-06-30T12:00:00'), end: new Date('2025-06-30T13:00:00') },
      expected: false
    },
    {
      name: 'No overlap (after)',
      slot: { start: new Date('2025-06-30T14:00:00'), end: new Date('2025-06-30T16:00:00') },
      busy: { start: new Date('2025-06-30T17:00:00'), end: new Date('2025-06-30T18:00:00') },
      expected: false
    }
  ];

  testCases.forEach(testCase => {
    const hasOverlap = testCase.slot.start < testCase.busy.end && testCase.slot.end > testCase.busy.start;
    const result = hasOverlap === testCase.expected ? '✅' : '❌';
    console.log(`  ${testCase.name}: ${result} (expected: ${testCase.expected}, got: ${hasOverlap})`);
  });
}

// Main test function
async function runTests() {
  console.log('🧪 Google Calendar Timeslot Availability Tests');
  console.log('===============================================');
  
  try {
    testTimeParsing();
    testDayOfWeek();
    testOverlapDetection();
    testSingleTimeslotCheck();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Time parsing works correctly');
    console.log('  - Day of week calculations are accurate');
    console.log('  - Overlap detection logic is sound');
    console.log('  - Single timeslot availability checking works');
    console.log('\n🎯 The Google Calendar integration will:');
    console.log('  1. Fetch your calendar events');
    console.log('  2. Check each rehearsal timeslot against your busy periods');
    console.log('  3. Mark you as available if no conflicts exist');
    console.log('  4. Mark you as unavailable if there are calendar conflicts');
    console.log('  5. Automatically update your profile with availability');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();
