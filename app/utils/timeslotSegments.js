/**
 * Utility functions for breaking timeslots into 30-minute segments
 */

// Convert time string to minutes since midnight
export const timeToMinutes = (timeStr) => {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (period === 'PM' && hours !== 12) hour24 += 12;
  if (period === 'AM' && hours === 12) hour24 = 0;
  
  return hour24 * 60 + (minutes || 0);
};

// Convert minutes back to time string
export const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${mins.toString().padStart(2, '0')} ${period}`;
};

// Generate all 30-minute time slots from 7am to 10pm
export const generateTimeSlots = () => {
  const slots = [];
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const minutes = h * 60 + m;
      slots.push(minutesToTime(minutes));
    }
  }
  return slots;
};

// Break a timeslot into 30-minute segments
export const breakTimeslotIntoSegments = (timeslot) => {
  const startMinutes = timeToMinutes(timeslot.startTime);
  const endMinutes = timeToMinutes(timeslot.endTime);
  const segments = [];
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const segmentStart = minutesToTime(minutes);
    const segmentEnd = minutesToTime(minutes + 30);
    
    segments.push({
      id: `${timeslot.id || timeslot._id}_${minutes}`,
      parentId: timeslot.id || timeslot._id,
      day: timeslot.day,
      startTime: segmentStart,
      endTime: segmentEnd,
      label: `${timeslot.label} (${segmentStart}-${segmentEnd})`,
      description: timeslot.description,
      isSegment: true,
      parentTimeslot: timeslot
    });
  }
  
  return segments;
};

// Convert multiple timeslots into segments
export const convertTimeslotsToSegments = (timeslots) => {
  const allSegments = [];
  
  timeslots.forEach(timeslot => {
    const segments = breakTimeslotIntoSegments(timeslot);
    allSegments.push(...segments);
  });
  
  return allSegments;
};

// Create a unique segment ID for a specific day/time combination
export const createSegmentId = (day, startTime) => {
  return `${day}_${startTime.replace(/[:\s]/g, '').toLowerCase()}`;
};

// Get all possible segments for the week (7 days × 32 time slots = 224 segments)
export const getAllPossibleSegments = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = generateTimeSlots();
  const segments = [];
  
  days.forEach(day => {
    timeSlots.forEach(startTime => {
      const startMinutes = timeToMinutes(startTime);
      const endTime = minutesToTime(startMinutes + 30);
      
      segments.push({
        id: createSegmentId(day, startTime),
        day,
        startTime,
        endTime,
        label: `${day} ${startTime}-${endTime}`,
        isSegment: true
      });
    });
  });
  
  return segments;
};

// Check if a segment is selected based on available timeslots
export const isSegmentSelected = (segment, selectedTimeslots) => {
  return selectedTimeslots.includes(segment.id);
};

// Convert selected segments back to timeslot format for API
export const convertSegmentsToTimeslots = (selectedSegments, allSegments) => {
  // If selectedSegments is an array of IDs, convert to segment objects
  const segmentObjects = selectedSegments.map(seg => {
    if (typeof seg === 'string') {
      return allSegments.find(s => s.id === seg);
    }
    return seg;
  }).filter(Boolean);
  
  // Group consecutive segments by day
  const segmentsByDay = {};
  
  segmentObjects.forEach(segment => {
    if (!segmentsByDay[segment.day]) {
      segmentsByDay[segment.day] = [];
    }
    segmentsByDay[segment.day].push(segment);
  });
  
  // Convert groups of consecutive segments into timeslots
  const timeslots = [];
  
  Object.entries(segmentsByDay).forEach(([day, segments]) => {
    // Sort segments by start time
    segments.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    
    // Group consecutive segments
    let currentGroup = [segments[0]];
    
    for (let i = 1; i < segments.length; i++) {
      const currentSegment = segments[i];
      const lastInGroup = currentGroup[currentGroup.length - 1];
      
      // Check if this segment is consecutive to the last one
      if (timeToMinutes(currentSegment.startTime) === timeToMinutes(lastInGroup.endTime)) {
        currentGroup.push(currentSegment);
      } else {
        // End current group and start new one
        timeslots.push(createTimeslotFromSegments(day, currentGroup));
        currentGroup = [currentSegment];
      }
    }
    
    // Add the last group
    if (currentGroup.length > 0) {
      timeslots.push(createTimeslotFromSegments(day, currentGroup));
    }
  });
  
  return timeslots;
};

// Create a timeslot from a group of consecutive segments
const createTimeslotFromSegments = (day, segments) => {
  const startTime = segments[0].startTime;
  const endTime = segments[segments.length - 1].endTime;
  
  return {
    day,
    startTime,
    endTime,
    label: `${day} ${startTime}-${endTime}`,
    description: `Available ${startTime} to ${endTime}`
  };
};
