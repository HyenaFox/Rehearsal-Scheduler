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
