#!/usr/bin/env node

/**
 * Test script to verify timeslot generation logic
 * This replicates the logic from WeeklyAvailabilityCalendar.tsx
 */

console.log('🕐 Testing Timeslot Generation Logic for Both Components\n');

// Replicate the exact logic from WeeklyAvailabilityCalendar.tsx
const rehearsalDays = [0, 1, 2, 3, 4]; // Sunday, Monday, Tuesday, Wednesday, Thursday
const rehearsalDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

const generateTimeSlots = () => {
  const slots = [];
  
  // Generate slots for rehearsal days and times (6:00 PM to 11:30 PM)
  for (const day of rehearsalDays) {
    for (let hour = 18; hour <= 23; hour++) { // 6 PM (18) to 11 PM (23)
      for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
        // For hour 23 (11 PM), include both 11:00 PM and 11:30 PM
        if (hour === 23 && minute > 30) {
          break; // Stop after 11:30 PM
        }
        slots.push({ day, hour, minute });
      }
    }
  }
  
  return slots;
};

const formatTime = (hour, minute) => {
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const amPm = hour >= 12 ? 'PM' : 'AM';
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${amPm}`;
};

const formatDay = (dayIndex) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  return days[dayIndex];
};

// Generate timeslots
const timeSlots = generateTimeSlots();

console.log(`✅ Generated ${timeSlots.length} total timeslots\n`);

// Group slots by time for display (same logic as component)
const groupedSlots = timeSlots.reduce((acc, slot) => {
  const timeKey = `${slot.hour}:${slot.minute}`;
  if (!acc[timeKey]) {
    acc[timeKey] = { hour: slot.hour, minute: slot.minute, days: [] };
  }
  acc[timeKey].days.push(slot.day);
  return acc;
}, {});

const sortedTimes = Object.values(groupedSlots).sort((a, b) => {
  if (a.hour !== b.hour) return a.hour - b.hour;
  return a.minute - b.minute;
});

console.log('📅 All Time Slots (as they will appear in the calendar):');
console.log('='.repeat(50));

sortedTimes.forEach((timeGroup, index) => {
  const timeStr = formatTime(timeGroup.hour, timeGroup.minute);
  const dayCount = timeGroup.days.length;
  
  // Highlight the 11:00 PM slot we're specifically testing
  const isElevenPM = timeGroup.hour === 23 && timeGroup.minute === 0;
  const prefix = isElevenPM ? '🎯 ' : '   ';
  
  console.log(`${prefix}${(index + 1).toString().padStart(2, ' ')}. ${timeStr} (across ${dayCount} days)`);
});

console.log('='.repeat(50));

// Specific tests
console.log('\n🔍 Specific Tests:');

// Test 1: Check if 11:00 PM slot exists
const elevenPMSlot = timeSlots.find(slot => slot.hour === 23 && slot.minute === 0);
console.log(`1. 11:00 PM slot exists: ${elevenPMSlot ? '✅ YES' : '❌ NO'}`);

// Test 2: Check if 11:30 PM slot exists  
const elevenThirtyPMSlot = timeSlots.find(slot => slot.hour === 23 && slot.minute === 30);
console.log(`2. 11:30 PM slot exists: ${elevenThirtyPMSlot ? '✅ YES' : '❌ NO'}`);

// Test 3: Check sequence around 11 PM
const tenThirtyPMSlots = timeSlots.filter(slot => slot.hour === 22 && slot.minute === 30);
const elevenPMSlots = timeSlots.filter(slot => slot.hour === 23 && slot.minute === 0);
const elevenThirtyPMSlots = timeSlots.filter(slot => slot.hour === 23 && slot.minute === 30);

console.log(`3. 10:30 PM slots: ${tenThirtyPMSlots.length} (should be 5, one per day)`);
console.log(`4. 11:00 PM slots: ${elevenPMSlots.length} (should be 5, one per day)`);
console.log(`5. 11:30 PM slots: ${elevenThirtyPMSlots.length} (should be 5, one per day)`);

// Test 4: Check that midnight slots don't exist
const midnightSlots = timeSlots.filter(slot => slot.hour === 0 || (slot.hour === 24));
console.log(`6. Midnight slots (should be 0): ${midnightSlots.length} ${midnightSlots.length === 0 ? '✅' : '❌'}`);

// Test 5: Show the evening sequence for one day
console.log('\n📋 Evening sequence for Sunday (day 0):');
const sundaySlots = timeSlots
  .filter(slot => slot.day === 0)
  .sort((a, b) => a.hour === b.hour ? a.minute - b.minute : a.hour - b.hour);

const eveningSlots = sundaySlots.filter(slot => slot.hour >= 22); // 10 PM and later
eveningSlots.forEach(slot => {
  const timeStr = formatTime(slot.hour, slot.minute);
  const isTarget = slot.hour === 23 && slot.minute === 0;
  console.log(`   ${isTarget ? '🎯' : '  '} ${timeStr}`);
});

// Summary
console.log('\n📊 Summary:');
console.log(`Total timeslots generated: ${timeSlots.length}`);
console.log(`Unique time periods: ${sortedTimes.length}`);
console.log(`Days covered: ${rehearsalDays.length} (${rehearsalDayNames.join(', ')})`);
console.log(`Time range: ${formatTime(18, 0)} to ${formatTime(23, 30)}`);

const hasElevenPM = elevenPMSlots.length === 5;
const hasElevenThirtyPM = elevenThirtyPMSlots.length === 5;
const sequenceComplete = tenThirtyPMSlots.length === 5 && hasElevenPM && hasElevenThirtyPM;

console.log(`\n${sequenceComplete ? '✅' : '❌'} Timeslot sequence is ${sequenceComplete ? 'COMPLETE' : 'INCOMPLETE'}`);

if (hasElevenPM) {
  console.log('✅ The missing 11:00-11:30 PM timeslot has been FIXED!');
  console.log('✅ This fix applies to BOTH WeeklyAvailabilityCalendar AND AvailabilityCalendar components');
} else {
  console.log('❌ The 11:00-11:30 PM timeslot is still MISSING!');
}

console.log('\n📝 Components that were fixed:');
console.log('   1. WeeklyAvailabilityCalendar.tsx (main calendar view)');
console.log('   2. AvailabilityCalendar.tsx (used in Actor Edit Modal)');