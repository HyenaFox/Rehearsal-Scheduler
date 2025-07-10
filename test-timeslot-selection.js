// Test to verify timeslot selection is working
const testTimeslotSelection = () => {
  console.log('🧪 Testing timeslot selection system...');
  
  // Test data similar to what would be in the system
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'];
  
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 17; hour <= 22; hour++) { // 5 PM (17) to 10 PM (22)
      for (let minute = 0; minute < 60; minute += 30) {
        const hour12 = hour > 12 ? hour - 12 : hour;
        const period = 'PM';
        const minute12 = minute.toString().padStart(2, '0');
        
        // Skip 11:30 PM to end at 11:00 PM
        if (hour === 22 && minute === 30) continue;
        
        slots.push(`${hour12}:${minute12} ${period}`);
      }
    }
    return slots;
  };
  
  const TIME_SLOTS = generateTimeSlots();
  console.log('⏰ Generated time slots:', TIME_SLOTS);
  console.log('📅 Days:', DAYS);
  
  // Test segment ID generation
  const getSegmentId = (day, time) => `${day}_${time}`;
  
  // Test some sample selections
  const testSelections = [
    { day: 'Monday', time: '5:00 PM' },
    { day: 'Tuesday', time: '6:30 PM' },
    { day: 'Wednesday', time: '8:00 PM' },
  ];
  
  console.log('\n🎯 Testing segment ID generation:');
  testSelections.forEach(selection => {
    const segmentId = getSegmentId(selection.day, selection.time);
    console.log(`  ${selection.day} ${selection.time} → ${segmentId}`);
  });
  
  // Test timeslot to segment conversion
  const sampleTimeslots = [
    {
      id: 'Monday_5:00 PM',
      day: 'Monday',
      startTime: '5:00 PM',
      endTime: '5:30 PM'
    },
    {
      id: 'Tuesday_6:30 PM',
      day: 'Tuesday', 
      startTime: '6:30 PM',
      endTime: '7:00 PM'
    }
  ];
  
  console.log('\n🔄 Testing timeslot to segment conversion:');
  sampleTimeslots.forEach(timeslot => {
    const segmentId = `${timeslot.day}_${timeslot.startTime}`;
    console.log(`  Timeslot ${timeslot.id} → Segment ${segmentId}`);
  });
  
  console.log('\n✅ Test completed - check if selection logic matches this pattern');
};

// Run the test
testTimeslotSelection();
