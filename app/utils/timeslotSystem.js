// Pre-populated timeslot system
// This utility provides all possible timeslots for rehearsals (5:00 PM - 11:00 PM, excluding Fridays)

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday']; // Excluding Friday

// Time slots every 30 minutes from 5:00 PM to 11:00 PM (6 hours = 12 slots)
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

// Generate all possible timeslot combinations (day + time)
const generateAllPossibleTimeslots = () => {
  const timeSlots = generateTimeSlots();
  const allTimeslots = [];
  
  DAYS.forEach(day => {
    timeSlots.forEach(time => {
      allTimeslots.push({
        id: `${day}_${time}`,
        day,
        time,
        startTime: time,
        endTime: getNextTimeSlot(time),
        available: true, // All slots are available by default
        duration: 30 // 30 minutes
      });
    });
  });
  
  return allTimeslots;
};

// Get the next 30-minute time slot
const getNextTimeSlot = (currentTime) => {
  const timeSlots = generateTimeSlots();
  const currentIndex = timeSlots.indexOf(currentTime);
  if (currentIndex === -1 || currentIndex === timeSlots.length - 1) {
    return '11:30 PM'; // End of day
  }
  return timeSlots[currentIndex + 1];
};

// Convert time string to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  
  return hour24 * 60 + (minutes || 0);
};

// Convert minutes since midnight to time string
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const period = hours >= 12 ? 'PM' : 'AM';
  
  return `${hour12}:${mins.toString().padStart(2, '0')} ${period}`;
};

// Get consecutive timeslots from a list of selected segment IDs
const getConsecutiveTimeslots = (segmentIds) => {
  if (!segmentIds || segmentIds.length === 0) return [];
  
  const timeslots = [];
  const segmentsByDay = {};
  
  // Group segments by day
  segmentIds.forEach(segmentId => {
    const [day, ...timeParts] = segmentId.split('_');
    const time = timeParts.join('_');
    if (!segmentsByDay[day]) segmentsByDay[day] = [];
    segmentsByDay[day].push(time);
  });
  
  // Process each day
  Object.entries(segmentsByDay).forEach(([day, times]) => {
    if (times.length === 0) return;
    
    // Sort times by their minute values
    times.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    
    let currentStart = times[0];
    let currentEnd = times[0];
    
    for (let i = 1; i < times.length; i++) {
      const time = times[i];
      const prevTime = times[i - 1];
      
      // Check if this time is consecutive (30 minutes after previous)
      if (timeToMinutes(time) === timeToMinutes(prevTime) + 30) {
        currentEnd = time;
      } else {
        // Gap found, finalize current timeslot
        const endTime = getNextTimeSlot(currentEnd);
        timeslots.push({
          id: `${day}_${currentStart}_${endTime}`,
          day,
          startTime: currentStart,
          endTime,
          duration: (timeToMinutes(endTime) - timeToMinutes(currentStart))
        });
        
        currentStart = time;
        currentEnd = time;
      }
    }
    
    // Add final timeslot
    const endTime = getNextTimeSlot(currentEnd);
    timeslots.push({
      id: `${day}_${currentStart}_${endTime}`,
      day,
      startTime: currentStart,
      endTime,
      duration: (timeToMinutes(endTime) - timeToMinutes(currentStart))
    });
  });
  
  return timeslots;
};

// Convert timeslot ranges back to segment IDs
const timeslotToSegmentIds = (timeslot) => {
  const { day, startTime, endTime } = timeslot;
  const segments = [];
  
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const time = minutesToTime(minutes);
    segments.push(`${day}_${time}`);
  }
  
  return segments;
};

// Check if a timeslot is available (not conflicting with existing rehearsals)
const isTimeslotAvailable = (timeslot, existingRehearsals = []) => {
  const { day, startTime, endTime } = timeslot;
  
  return !existingRehearsals.some(rehearsal => {
    if (!rehearsal.timeslot || rehearsal.timeslot.day !== day) return false;
    
    const rehearsalStart = timeToMinutes(rehearsal.timeslot.startTime);
    const rehearsalEnd = timeToMinutes(rehearsal.timeslot.endTime);
    const timeslotStart = timeToMinutes(startTime);
    const timeslotEnd = timeToMinutes(endTime);
    
    // Check for overlap
    return (timeslotStart < rehearsalEnd && timeslotEnd > rehearsalStart);
  });
};

// Format timeslot for display
const formatTimeslot = (timeslot) => {
  const { day, startTime, endTime } = timeslot;
  return `${day} ${startTime} - ${endTime}`;
};

export {
    DAYS, formatTimeslot, generateAllPossibleTimeslots, generateTimeSlots, getConsecutiveTimeslots, getNextTimeSlot, isTimeslotAvailable, minutesToTime, timeslotToSegmentIds, timeToMinutes
};

