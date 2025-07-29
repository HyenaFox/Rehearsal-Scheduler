// Timezone utility functions for the rehearsal scheduler

export interface TimezoneInfo {
  id: string;
  name: string;
  offset: string;
  abbreviation: string;
}

// Common timezones for theater groups
export const COMMON_TIMEZONES: TimezoneInfo[] = [
  { id: 'America/New_York', name: 'Eastern Time', offset: 'UTC-5/-4', abbreviation: 'ET' },
  { id: 'America/Chicago', name: 'Central Time', offset: 'UTC-6/-5', abbreviation: 'CT' },
  { id: 'America/Denver', name: 'Mountain Time', offset: 'UTC-7/-6', abbreviation: 'MT' },
  { id: 'America/Los_Angeles', name: 'Pacific Time', offset: 'UTC-8/-7', abbreviation: 'PT' },
  { id: 'America/Toronto', name: 'Eastern Time (Canada)', offset: 'UTC-5/-4', abbreviation: 'ET' },
  { id: 'America/Vancouver', name: 'Pacific Time (Canada)', offset: 'UTC-8/-7', abbreviation: 'PT' },
  { id: 'Europe/London', name: 'Greenwich Mean Time', offset: 'UTC+0/+1', abbreviation: 'GMT' },
  { id: 'Europe/Paris', name: 'Central European Time', offset: 'UTC+1/+2', abbreviation: 'CET' },
  { id: 'Asia/Tokyo', name: 'Japan Standard Time', offset: 'UTC+9', abbreviation: 'JST' },
  { id: 'Australia/Sydney', name: 'Australian Eastern Time', offset: 'UTC+10/+11', abbreviation: 'AET' },
  { id: 'UTC', name: 'Coordinated Universal Time', offset: 'UTC+0', abbreviation: 'UTC' },
];

/**
 * Get the user's local timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect user timezone, defaulting to UTC:', error);
    return 'UTC';
  }
}

/**
 * Get timezone info by ID
 */
export function getTimezoneInfo(timezoneId: string): TimezoneInfo | null {
  return COMMON_TIMEZONES.find(tz => tz.id === timezoneId) || null;
}

/**
 * Format a date/time for display in a specific timezone
 */
export function formatDateTimeInTimezone(
  date: Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
      ...options
    };

    return new Intl.DateTimeFormat('en-US', {
      ...defaultOptions,
      timeZone: timezone
    }).format(date);
  } catch (error) {
    console.warn(`Error formatting date in timezone ${timezone}:`, error);
    return date.toLocaleString();
  }
}

/**
 * Convert a time string from one timezone to another
 */
export function convertTimeToTimezone(
  dateString: string,
  timeString: string,
  fromTimezone: string,
  toTimezone: string
): { date: string; time: string; formatted: string } {
  try {
    // Parse the input date and time
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Create a date in the source timezone
    const sourceDate = new Date();
    sourceDate.setFullYear(year, month - 1, day);
    sourceDate.setHours(hours, minutes, 0, 0);
    
    // Convert to target timezone
    const targetDate = new Date(sourceDate.toLocaleString('en-US', { timeZone: toTimezone }));
    
    // Format the result
    const targetDateString = targetDate.getFullYear() + '-' + 
      String(targetDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(targetDate.getDate()).padStart(2, '0');
    
    const targetTimeString = String(targetDate.getHours()).padStart(2, '0') + ':' + 
      String(targetDate.getMinutes()).padStart(2, '0');
    
    const formatted = formatDateTimeInTimezone(targetDate, toTimezone);
    
    return {
      date: targetDateString,
      time: targetTimeString,
      formatted
    };
  } catch (error) {
    console.warn('Error converting time between timezones:', error);
    return {
      date: dateString,
      time: timeString,
      formatted: `${dateString} ${timeString}`
    };
  }
}

/**
 * Get the current time offset for a timezone (accounting for DST)
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utcTime + (getTimezoneOffsetMinutes(timezone) * 60000));
    return targetTime.getTimezoneOffset();
  } catch (error) {
    console.warn(`Error getting timezone offset for ${timezone}:`, error);
    return 0;
  }
}

/**
 * Get timezone offset in minutes
 */
function getTimezoneOffsetMinutes(timezone: string): number {
  try {
    const now = new Date();
    const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const timeInUTC = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    return (timeInTimezone.getTime() - timeInUTC.getTime()) / (1000 * 60);
  } catch (error) {
    console.warn(`Error calculating offset for ${timezone}:`, error);
    return 0;
  }
}

/**
 * Check if two dates/times overlap when accounting for different timezones
 */
export function checkTimezoneOverlap(
  event1: { date: string; startTime: string; endTime: string; timezone: string },
  event2: { date: string; startTime: string; endTime: string; timezone: string }
): boolean {
  try {
    // Convert both events to UTC for comparison
    const event1Start = convertTimeToTimezone(event1.date, event1.startTime, event1.timezone, 'UTC');
    const event1End = convertTimeToTimezone(event1.date, event1.endTime, event1.timezone, 'UTC');
    
    const event2Start = convertTimeToTimezone(event2.date, event2.startTime, event2.timezone, 'UTC');
    const event2End = convertTimeToTimezone(event2.date, event2.endTime, event2.timezone, 'UTC');
    
    // Create Date objects for comparison
    const start1 = new Date(`${event1Start.date}T${event1Start.time}:00Z`);
    const end1 = new Date(`${event1End.date}T${event1End.time}:00Z`);
    const start2 = new Date(`${event2Start.date}T${event2Start.time}:00Z`);
    const end2 = new Date(`${event2End.date}T${event2End.time}:00Z`);
    
    // Check for overlap
    return start1 < end2 && start2 < end1;
  } catch (error) {
    console.warn('Error checking timezone overlap:', error);
    return false;
  }
}

/**
 * Format a time for display with timezone info
 */
export function formatTimeWithTimezone(
  date: string,
  time: string,
  timezone: string,
  userTimezone?: string
): string {
  try {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    const dateObj = new Date();
    dateObj.setFullYear(year, month - 1, day);
    dateObj.setHours(hours, minutes, 0, 0);
    
    const formatted = formatDateTimeInTimezone(dateObj, timezone, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    // If user has a different timezone, show both
    if (userTimezone && userTimezone !== timezone) {
      const userFormatted = formatDateTimeInTimezone(dateObj, userTimezone, {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      return `${formatted} (${userFormatted} your time)`;
    }
    
    return formatted;
  } catch (error) {
    console.warn('Error formatting time with timezone:', error);
    return `${date} ${time}`;
  }
}

/**
 * Get a list of upcoming rehearsals sorted by time, accounting for user's timezone
 */
export function sortRehearsalsByTime(
  rehearsals: Array<{
    date: string;
    time: { start: string; end: string };
    timezone?: string;
    title: string;
  }>,
  userTimezone: string
): Array<{
  rehearsal: any;
  localDate: string;
  localTime: string;
  originalTime: string;
}> {
  try {
    return rehearsals
      .map(rehearsal => {
        const timezone = rehearsal.timezone || 'UTC';
        const converted = convertTimeToTimezone(
          rehearsal.date,
          rehearsal.time.start,
          timezone,
          userTimezone
        );
        
        return {
          rehearsal,
          localDate: converted.date,
          localTime: converted.time,
          originalTime: formatTimeWithTimezone(rehearsal.date, rehearsal.time.start, timezone),
          sortKey: new Date(`${converted.date}T${converted.time}:00`).getTime()
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  } catch (error) {
    console.warn('Error sorting rehearsals by time:', error);
    return rehearsals.map(rehearsal => ({
      rehearsal,
      localDate: rehearsal.date,
      localTime: rehearsal.time.start,
      originalTime: `${rehearsal.date} ${rehearsal.time.start}`
    }));
  }
}