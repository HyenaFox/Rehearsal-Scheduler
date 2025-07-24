// Global timeslot definitions used throughout the application

/**
 * Rehearsal days: Sunday (0), Monday (1), Tuesday (2), Wednesday (3), Thursday (4)
 */
export const REHEARSAL_DAYS = [0, 1, 2, 3, 4];

/**
 * Generate global timeslots for rehearsal scheduling
 * These are the only timeslots that should be used for rehearsals
 * @returns {Array} Array of timeslot objects with day, hour, minute
 */
export const generateGlobalTimeSlots = () => {
  const slots = [];
  
  // Generate slots for rehearsal days and times (6:00 PM to 11:30 PM)
  for (const day of REHEARSAL_DAYS) {
    for (let hour = 18; hour <= 23; hour++) { // 6 PM (18) to 11 PM (23)
      for (let minute = 0; minute < 60; minute += 30) { // 30-minute intervals
        // Include 11:30 PM (23:30) as the last slot
        if (hour === 23 && minute === 30) {
          slots.push({ day, hour, minute });
          break; // Stop after 11:30 PM
        } else if (hour < 23) {
          slots.push({ day, hour, minute });
        }
      }
    }
  }
  
  return slots;
};

/**
 * Convert a global timeslot to a format compatible with the autoscheduler
 * @param {Object} slot - Timeslot object with day, hour, minute
 * @returns {Object} Timeslot object with id, startTime, endTime, label
 */
export const convertToAutoSchedulerFormat = (slot) => {
  const { hour, minute } = slot;
  
  // Calculate end time (30 minutes later)
  let endHour = minute === 30 ? hour + 1 : hour;
  const endMinute = minute === 30 ? 0 : 30;
  
  // Handle midnight rollover for 11:30 PM slot
  if (endHour === 24) {
    endHour = 0;
  }
  
  const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  
  const startTime12 = new Date(`2000-01-01T${startTime}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Handle midnight display for end time
  const endTimeForDisplay = endHour === 0 ? '00:00' : endTime;
  const endTime12 = new Date(`2000-01-01T${endTimeForDisplay}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return {
    id: `${hour}:${minute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
    startTime: startTime,
    endTime: endTime,
    label: `${startTime12} - ${endTime12}`,
    day: slot.day
  };
};

/**
 * Get all global timeslots in autoscheduler format for a specific day
 * @param {number} dayOfWeek - Day of the week (0=Sunday, 1=Monday, etc.)
 * @returns {Array} Array of timeslot objects for the specified day
 */
export const getGlobalTimeSlotsForDay = (dayOfWeek) => {
  const allSlots = generateGlobalTimeSlots();
  return allSlots
    .filter(slot => slot.day === dayOfWeek)
    .map(convertToAutoSchedulerFormat);
};

/**
 * Check if a given day is a valid rehearsal day
 * @param {number} dayOfWeek - Day of the week (0=Sunday, 1=Monday, etc.)
 * @returns {boolean} True if it's a rehearsal day
 */
export const isRehearsalDay = (dayOfWeek) => {
  return REHEARSAL_DAYS.includes(dayOfWeek);
};

/**
 * Get the names of rehearsal days
 * @returns {Array} Array of day names
 */
export const getRehearsalDayNames = () => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return REHEARSAL_DAYS.map(dayIndex => dayNames[dayIndex]);
};
