const express = require('express');
const { google } = require('googleapis');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Timeslot = require('../models/Timeslot');

const router = express.Router();

// OAuth2 client configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/calendar/auth/google/callback'
);

// Generate Google OAuth URL
router.get('/auth/google', authenticateToken, async (req, res) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      state: req.user.id // Pass user ID to identify user after callback
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

// Handle Google OAuth callback (GET - direct from Google)
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, error, state } = req.query;
    
    if (error) {
      // Send error page that will communicate with parent window
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: red; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Authorization Failed</h2>
            <p>Error: ${error}</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_ERROR',
                error: '${error}'
              }, '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
        </html>
      `);
    }

    if (code && state) {
      try {
        // Process the authorization code directly here
        const { tokens } = await oauth2Client.getToken(code);
        
        // Store tokens in user record using the state (user ID)
        await User.findByIdAndUpdate(state, {
          googleTokens: tokens,
          googleConnected: true
        });

        console.log(`✅ Google Calendar connected for user: ${state}`);

        // Send success page
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authorization Successful</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .success { color: green; font-size: 18px; }
            </style>
          </head>
          <body>
            <div class="success">
              <h2>✅ Authorization Successful!</h2>
              <p>Google Calendar has been connected successfully!</p>
              <p>This window will close automatically...</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_SUCCESS',
                  connected: true
                }, '*');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
          </html>
        `);
      } catch (tokenError) {
        console.error('Error exchanging code for tokens:', tokenError);
        return res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authorization Failed</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .error { color: red; font-size: 18px; }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>❌ Authorization Failed</h2>
              <p>Failed to exchange authorization code for tokens</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_ERROR',
                  error: 'Failed to exchange authorization code'
                }, '*');
              }
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
          </html>
        `);
      }
    }

    // No code or error - something went wrong
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorization Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: red; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Authorization Failed</h2>
          <p>No authorization code received</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_ERROR',
              error: 'No authorization code received'
            }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error handling Google OAuth callback:', error);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authorization Failed</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: red; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Server Error</h2>
          <p>Server error during authorization</p>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_ERROR',
              error: 'Server error during authorization'
            }, '*');
          }
          setTimeout(() => window.close(), 2000);
        </script>
      </body>
      </html>
    `);
  }
});

// Handle Google OAuth callback (POST - from frontend)
router.post('/auth/google/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const { tokens } = await oauth2Client.getAccessToken(code);
    
    // Store tokens in user record
    await User.findByIdAndUpdate(req.user.id, {
      googleTokens: tokens,
      googleConnected: true
    });

    res.json({ success: true, message: 'Google Calendar connected successfully' });
  } catch (error) {
    console.error('Error handling Google callback:', error);
    res.status(500).json({ error: 'Failed to connect Google Calendar' });
  }
});

// Get Google Calendar connection status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isConnected = !!(user.googleTokens && user.googleConnected);
    
    let googleEmail = null;
    if (isConnected) {
      try {
        oauth2Client.setCredentials(user.googleTokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        googleEmail = userInfo.data.email;
      } catch (error) {
        console.log('Could not fetch Google user info:', error.message);
      }
    }

    res.json({
      connected: isConnected,
      googleEmail,
      hasAvailableSlots: false // Will be implemented later
    });
  } catch (error) {
    console.error('Error checking Google Calendar status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

// Import availability from Google Calendar
router.get('/import-availability', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user.googleTokens || !user.googleConnected) {
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    oauth2Client.setCredentials(user.googleTokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get all timeslots to check availability against
    const timeslots = await Timeslot.find({});
    console.log(`Found ${timeslots.length} timeslots to check availability against`);
    
    // Get calendar events for the next 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    console.log(`Fetching Google Calendar events from ${now.toISOString()} to ${thirtyDaysFromNow.toISOString()}`);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`Found ${events.length} events in Google Calendar`);
    
    const busyTimes = events.map(event => ({
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
      summary: event.summary || 'Busy'
    }));

    // Helper function to check if a timeslot conflicts with busy times
    const isTimeslotAvailable = (timeslot, busyTimes) => {
      // Convert day name to day number (0 = Sunday, 1 = Monday, etc.)
      const dayMap = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6
      };
      
      const timeslotDayNum = dayMap[timeslot.day];
      if (timeslotDayNum === undefined) {
        console.warn(`Unknown day: ${timeslot.day}`);
        return false;
      }

      // Parse timeslot times (assuming format like "10:00 AM")
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        
        return { hours: hour24, minutes };
      };

      const startTime = parseTime(timeslot.startTime);
      const endTime = parseTime(timeslot.endTime);

      // Check each week in the date range
      const startDate = new Date(now);
      const endDate = new Date(thirtyDaysFromNow);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === timeslotDayNum) {
          // Create timeslot instances for this week
          const timeslotStart = new Date(date);
          timeslotStart.setHours(startTime.hours, startTime.minutes, 0, 0);
          
          const timeslotEnd = new Date(date);
          timeslotEnd.setHours(endTime.hours, endTime.minutes, 0, 0);
          
          // Check if this timeslot instance conflicts with any busy time
          const hasConflict = busyTimes.some(busyTime => {
            const busyStart = new Date(busyTime.start);
            const busyEnd = new Date(busyTime.end);
            
            // Check for overlap: timeslot and busy time overlap if one starts before the other ends
            const overlaps = (timeslotStart < busyEnd && timeslotEnd > busyStart);
            
            if (overlaps) {
              console.log(`Conflict found for ${timeslot.label} on ${date.toDateString()}: overlaps with event "${busyTime.summary}" (${busyStart.toLocaleString()} - ${busyEnd.toLocaleString()})`);
            }
            
            return overlaps;
          });
          
          if (hasConflict) {
            return false; // If any instance conflicts, timeslot is not available
          }
        }
      }
      
      return true; // No conflicts found
    };

    // Check which timeslots are available (not conflicting with busy times)
    const availableSlots = [];
    const unavailableSlots = [];
    
    console.log('Checking timeslots for availability...');
    for (const timeslot of timeslots) {
      console.log(`Checking timeslot: ${timeslot.label} (${timeslot.day} ${timeslot.startTime}-${timeslot.endTime})`);
      
      const isAvailable = isTimeslotAvailable(timeslot, busyTimes);
      
      if (isAvailable) {
        availableSlots.push({
          timeslotId: timeslot._id.toString(),
          title: timeslot.label,
          startTime: timeslot.startTime,
          endTime: timeslot.endTime,
          dayOfWeek: timeslot.day
        });
        console.log(`✅ Timeslot ${timeslot.label} is available`);
      } else {
        unavailableSlots.push({
          timeslotId: timeslot._id.toString(),
          title: timeslot.label,
          startTime: timeslot.startTime,
          endTime: timeslot.endTime,
          dayOfWeek: timeslot.day
        });
        console.log(`❌ Timeslot ${timeslot.label} has conflicts`);
      }
    }
    
    console.log(`Found ${availableSlots.length} available slots out of ${timeslots.length} total timeslots`);
    console.log(`${unavailableSlots.length} timeslots have conflicts with Google Calendar events`);

    res.json({
      availableSlots,
      unavailableSlots,
      totalTimeslots: timeslots.length,
      busyEventsCount: events.length,
      dateRange: {
        from: now.toISOString(),
        to: thirtyDaysFromNow.toISOString()
      }
    });

  } catch (error) {
    console.error('Error importing Google Calendar availability:', error);
    
    // Handle token refresh if needed
    if (error.code === 401) {
      return res.status(401).json({ error: 'Google Calendar authorization expired. Please reconnect.' });
    }
    
    res.status(500).json({ error: 'Failed to import availability from Google Calendar' });
  }
});

// Disconnect Google Calendar
router.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { googleTokens: 1 },
      googleConnected: false
    });

    res.json({ success: true, message: 'Google Calendar disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect Google Calendar' });
  }
});

// Legacy endpoints (keeping for compatibility)
router.get('/events', authenticateToken, async (req, res) => {
  res.status(501).json({ error: 'Use /import-availability instead' });
});

router.post('/events', authenticateToken, async (req, res) => {
  res.status(501).json({ error: 'Event creation not yet implemented' });
});

router.put('/events/:id', authenticateToken, async (req, res) => {
  res.status(501).json({ error: 'Event update not yet implemented' });
});

router.delete('/events/:id', authenticateToken, async (req, res) => {
  res.status(501).json({ error: 'Event deletion not yet implemented' });
});

module.exports = router;