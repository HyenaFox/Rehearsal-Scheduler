const express = require('express');
const { google } = require('googleapis');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const WeeklyAvailability = require('../models/WeeklyAvailability');

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
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
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
        console.log('🔄 Processing OAuth authorization code...');
        const { tokens } = await oauth2Client.getToken(code);
        console.log('🎫 Received tokens from Google:', {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          tokenType: tokens.token_type,
          expiryDate: tokens.expiry_date,
          scope: tokens.scope
        });
        
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
    
    console.log(`🔍 Status check for user ${req.user.id}: isConnected=${isConnected}, hasTokens=${!!user.googleTokens}, googleConnected=${user.googleConnected}`);
    
    let googleEmail = null;
    let actuallyConnected = false;
    
    if (isConnected) {
      try {
        console.log('🔑 Setting credentials and testing Google API access...');
        console.log('🎫 Token details:', {
          hasAccessToken: !!user.googleTokens.access_token,
          hasRefreshToken: !!user.googleTokens.refresh_token,
          tokenType: user.googleTokens.token_type,
          expiryDate: user.googleTokens.expiry_date,
          accessTokenLength: user.googleTokens.access_token?.length,
          refreshTokenLength: user.googleTokens.refresh_token?.length
        });
        
        oauth2Client.setCredentials(user.googleTokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        googleEmail = userInfo.data.email;
        actuallyConnected = true;
        console.log(`✅ Google API access successful for ${googleEmail}`);
      } catch (error) {
        console.log('❌ Could not fetch Google user info:', error.message);
        
        // If token is invalid (expired), clear the stored tokens
        if (error.message === 'invalid_grant') {
          console.log('🧹 Google tokens expired, clearing stored tokens');
          await User.findByIdAndUpdate(req.user.id, {
            $unset: { 
              googleTokens: '',
              googleConnected: ''
            }
          });
          actuallyConnected = false;
        }
      }
    }

    console.log(`📋 Final status: actuallyConnected=${actuallyConnected}, googleEmail=${googleEmail}`);
    res.json({
      connected: actuallyConnected,
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

    // Get actual timeslots from the database instead of generating our own
    console.log('📅 Fetching actual timeslots from WeeklyAvailability collection...');
    const weeklyAvailabilities = await WeeklyAvailability.find({}).sort({ day: 1, hour: 1, minute: 1 });
    console.log(`📋 Found ${weeklyAvailabilities.length} timeslots in database`);
    
    // Debug: show what timeslots we found
    weeklyAvailabilities.forEach((slot, index) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = slot.dayOfWeek !== undefined ? slot.dayOfWeek : 'undefined';
      const startTime = slot.startTime || 'undefined';
      const endTime = slot.endTime || 'undefined';
      console.log(`📋 Slot ${index + 1}: ${days[dayOfWeek] || 'unknown'} ${startTime} - ${endTime} (dayOfWeek=${dayOfWeek})`);
      console.log(`📋 Raw slot data:`, { dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime, _id: slot._id });
    });
    
    if (weeklyAvailabilities.length === 0) {
      console.log('❌ No timeslots found in WeeklyAvailability collection!');
      return res.json({
        availableSlots: [],
        unavailableSlots: [],
        totalTimeslots: 0,
        busyEventsCount: 0,
        error: 'No timeslots configured in the system',
        dateRange: {
          from: new Date().toISOString(),
          to: new Date().toISOString()
        }
      });
    }

    // Convert database timeslots to a format we can work with for the next 7 days
    const generateTimeslotsFromDatabase = (weeklyAvailabilities) => {
      const timeslots = [];
      const now = new Date();
      
      console.log(`📅 Generating timeslots for next 7 days starting from ${now.toISOString()}`);
      
      // For each of the next 7 days (0 to 6)
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date(now.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
        const dayOfWeek = date.getDay();
        
        // Find all timeslots for this day of the week
        const timeslotsForDay = weeklyAvailabilities.filter(slot => slot.dayOfWeek === dayOfWeek);
        
        // Create actual dated timeslots for this specific date
        timeslotsForDay.forEach(slot => {
          // Parse startTime (format: "HH:mm")
          const [hour, minute] = slot.startTime.split(':').map(num => parseInt(num, 10));
          
          const slotDate = new Date(date);
          slotDate.setHours(hour, minute, 0, 0);
          
          timeslots.push({
            id: `${slotDate.toISOString().split('T')[0]}-${slot.startTime}`,
            date: new Date(slotDate),
            dayOfWeek: dayOfWeek,
            hour: hour,
            minute: minute,
            startTime: slot.startTime,
            endTime: slot.endTime,
            weeklyAvailabilityId: slot._id.toString()
          });
        });
      }
      
      console.log(`✅ Generated ${timeslots.length} actual timeslots from database (should match database count)`);
      return timeslots;
    };

    const actualTimeslots = generateTimeslotsFromDatabase(weeklyAvailabilities);
    console.log(`✅ Generated ${actualTimeslots.length} actual timeslots from database (vs potential maximum of ${weeklyAvailabilities.length * 7})`);

    // Get calendar events for the next 7 days
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

    console.log(`Fetching Google Calendar events from ${now.toISOString()} to ${sevenDaysFromNow.toISOString()}`);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: sevenDaysFromNow.toISOString(),
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
    const isTimeslotFree = (timeslot, busyTimes) => {
      const slotStart = new Date(timeslot.date);
      const slotEnd = new Date(slotStart.getTime() + (30 * 60 * 1000)); // 30 minutes later
      
      // Check if this timeslot conflicts with any busy time
      const hasConflict = busyTimes.some(busyTime => {
        const busyStart = new Date(busyTime.start);
        const busyEnd = new Date(busyTime.end);
        
        // Check for overlap: timeslot and busy time overlap if one starts before the other ends
        const overlaps = (slotStart < busyEnd && slotEnd > busyStart);
        
        if (overlaps) {
          console.log(`Conflict found for timeslot ${timeslot.id}: overlaps with event "${busyTime.summary}" (${busyStart.toLocaleString()} - ${busyEnd.toLocaleString()})`);
        }
        
        return overlaps;
      });
      
      return !hasConflict;
    };

    // Check which timeslots are free (not conflicting with busy times)
    const availableSlots = [];
    const unavailableSlots = [];
    
    console.log('Checking actual timeslots for conflicts...');
    for (const timeslot of actualTimeslots) {
      const isAvailable = isTimeslotFree(timeslot, busyTimes);
      
      if (isAvailable) {
        availableSlots.push({
          timeslotId: timeslot.id,
          date: timeslot.date.toISOString(),
          dayOfWeek: timeslot.dayOfWeek,
          hour: timeslot.hour,
          minute: timeslot.minute
        });
        console.log(`✅ Timeslot ${timeslot.id} is free`);
      } else {
        unavailableSlots.push({
          timeslotId: timeslot.id,
          date: timeslot.date.toISOString(),
          dayOfWeek: timeslot.dayOfWeek,
          hour: timeslot.hour,
          minute: timeslot.minute
        });
        console.log(`❌ Timeslot ${timeslot.id} has conflicts`);
      }
    }
    
    console.log(`Found ${availableSlots.length} available timeslots out of ${actualTimeslots.length} total actual timeslots`);
    console.log(`${unavailableSlots.length} timeslots have conflicts with Google Calendar events`);

    res.json({
      availableSlots,
      unavailableSlots,
      totalTimeslots: actualTimeslots.length,
      busyEventsCount: events.length,
      dateRange: {
        from: now.toISOString(),
        to: sevenDaysFromNow.toISOString()
      }
    });

  } catch (error) {
    console.error('Error importing Google Calendar availability:', error);
    
    // Handle expired/invalid tokens
    if (error.message === 'invalid_grant' || (error.response && error.response.data && error.response.data.error === 'invalid_grant')) {
      // Clear the expired tokens from the database
      await User.findByIdAndUpdate(req.user.id, {
        $unset: { 
          googleTokens: '',
          googleConnected: ''
        }
      });
      return res.status(401).json({ error: 'Google Calendar authorization expired. Please reconnect your Google account.' });
    }
    
    // Handle other 401 authorization errors
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

// Get available timeslots from WeeklyAvailability
router.get('/available-slots', async (req, res) => {
  try {
    const slots = await WeeklyAvailability.find({}).sort({ dayOfWeek: 1, startTime: 1 });
    res.json(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
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