const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Generate OAuth URL for user consent
  getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw new Error('Failed to exchange code for tokens');
    }
  }

  // Set credentials for API calls
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Get user's calendar events (to find available time slots)
  async getCalendarEvents(timeMin, timeMax) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  // Calculate available time slots based on busy periods
  calculateAvailableSlots(events, workingHours = { start: 9, end: 17 }) {
    const availableSlots = [];
    const busyPeriods = [];

    // Extract busy periods from events
    events.forEach(event => {
      if (event.start && event.end) {
        const startTime = new Date(event.start.dateTime || event.start.date);
        const endTime = new Date(event.end.dateTime || event.end.date);
        
        // Skip all-day events for availability calculation
        if (event.start.dateTime && event.end.dateTime) {
          busyPeriods.push({ start: startTime, end: endTime });
        }
      }
    });

    // Sort busy periods by start time
    busyPeriods.sort((a, b) => a.start - b.start);

    // Generate available slots (simplified - can be enhanced)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (let date = new Date(today); date <= nextWeek; date.setDate(date.getDate() + 1)) {
      // Skip weekends (can be made configurable)
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Generate hourly slots during working hours
      for (let hour = workingHours.start; hour < workingHours.end; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Check if this slot conflicts with any busy period
        const isAvailable = !busyPeriods.some(busy => 
          (slotStart >= busy.start && slotStart < busy.end) ||
          (slotEnd > busy.start && slotEnd <= busy.end) ||
          (slotStart <= busy.start && slotEnd >= busy.end)
        );

        if (isAvailable) {
          availableSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            day: slotStart.toLocaleDateString('en-US', { weekday: 'long' }),
            time: slotStart.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              hour12: true 
            })
          });
        }
      }
    }

    return availableSlots;
  }

  // Check specific timeslots against Google Calendar events
  async checkTimeslotAvailability(timeslots, dateRange = 30) {
    try {
      // Get calendar events for the specified date range
      const today = new Date();
      const futureDate = new Date(today.getTime() + dateRange * 24 * 60 * 60 * 1000);
      
      const events = await this.getCalendarEvents(
        today.toISOString(),
        futureDate.toISOString()
      );

      console.log(`📅 Retrieved ${events.length} calendar events for availability check`);

      // Extract busy periods from events
      const busyPeriods = events
        .filter(event => event.start && event.end && event.start.dateTime && event.end.dateTime)
        .map(event => ({
          start: new Date(event.start.dateTime),
          end: new Date(event.end.dateTime),
          summary: event.summary || 'Untitled Event'
        }));

      console.log(`📅 Found ${busyPeriods.length} busy periods`);

      // Check each timeslot against busy periods
      const timeslotAvailability = timeslots.map(timeslot => {
        const availability = this.checkSingleTimeslotAvailability(timeslot, busyPeriods, dateRange);
        console.log(`📅 Timeslot ${timeslot.label}: ${availability.totalAvailableDays}/${availability.totalDays} days available`);
        return availability;
      });

      return {
        timeslots: timeslotAvailability,
        totalEvents: events.length,
        busyPeriodsCount: busyPeriods.length,
        dateRange: {
          from: today.toISOString(),
          to: futureDate.toISOString()
        }
      };
    } catch (error) {
      console.error('Error checking timeslot availability:', error);
      throw new Error('Failed to check timeslot availability against calendar');
    }
  }

  // Check a single timeslot against busy periods across multiple days
  checkSingleTimeslotAvailability(timeslot, busyPeriods, dateRange) {
    const { day, startTime, endTime } = timeslot;
    const dayMap = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    
    const targetDayOfWeek = dayMap[day];
    if (targetDayOfWeek === undefined) {
      console.warn(`⚠️ Invalid day format: ${day}`);
      return {
        ...timeslot,
        isAvailable: false,
        availability: 0,
        conflicts: [],
        reason: 'Invalid day format'
      };
    }

    // Parse time strings (e.g., "2:00 PM" -> hour: 14, minute: 0)
    const parseTime = (timeStr) => {
      const [time, period] = timeStr.split(' ');
      const [hourStr, minuteStr] = time.split(':');
      let hour = parseInt(hourStr);
      const minute = parseInt(minuteStr || '0');
      
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      return { hour, minute };
    };

    const startParsed = parseTime(startTime);
    const endParsed = parseTime(endTime);

    if (!startParsed || !endParsed) {
      console.warn(`⚠️ Invalid time format: ${startTime} - ${endTime}`);
      return {
        ...timeslot,
        isAvailable: false,
        availability: 0,
        conflicts: [],
        reason: 'Invalid time format'
      };
    }

    // Find all occurrences of this day within the date range
    const today = new Date();
    const endDate = new Date(today.getTime() + dateRange * 24 * 60 * 60 * 1000);
    const occurrences = [];
    
    for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
      if (date.getDay() === targetDayOfWeek) {
        const slotStart = new Date(date);
        slotStart.setHours(startParsed.hour, startParsed.minute, 0, 0);
        
        const slotEnd = new Date(date);
        slotEnd.setHours(endParsed.hour, endParsed.minute, 0, 0);
        
        // Handle cases where end time is next day (e.g., late night rehearsals)
        if (slotEnd <= slotStart) {
          slotEnd.setDate(slotEnd.getDate() + 1);
        }
        
        occurrences.push({ start: slotStart, end: slotEnd });
      }
    }

    // Check each occurrence against busy periods
    const conflicts = [];
    let availableCount = 0;

    occurrences.forEach((occurrence, index) => {
      const conflictingEvents = busyPeriods.filter(busy => 
        // Check for any overlap between the timeslot and busy period
        (occurrence.start < busy.end && occurrence.end > busy.start)
      );

      if (conflictingEvents.length === 0) {
        availableCount++;
      } else {
        conflicts.push({
          date: occurrence.start.toDateString(),
          conflictingEvents: conflictingEvents.map(event => ({
            summary: event.summary,
            start: event.start.toISOString(),
            end: event.end.toISOString()
          }))
        });
      }
    });

    const availability = occurrences.length > 0 ? (availableCount / occurrences.length) : 0;
    const isAvailable = availability > 0.5; // Available if more than 50% of occurrences are free

    return {
      ...timeslot,
      isAvailable,
      availability: Math.round(availability * 100) / 100, // Round to 2 decimal places
      totalDays: occurrences.length,
      totalAvailableDays: availableCount,
      conflicts,
      nextAvailableDate: occurrences.find((occ, i) => 
        !busyPeriods.some(busy => occ.start < busy.end && occ.end > busy.start)
      )?.start.toDateString() || null
    };
  }

  // Get user info from Google
  async getUserInfo() {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error('Failed to get user info');
    }
  }
}

module.exports = GoogleCalendarService;
