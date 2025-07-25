const express = require('express');
const { google } = require('googleapis');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const WeeklyAvailability = require('../models/WeeklyAvailability');

const router = express.Router();

// OAuth2 client configuration with dynamic redirect URI
// Environment variables used:
// - GOOGLE_REDIRECT_URI: Explicit redirect URI (highest priority)
// - FRONTEND_URL: Frontend app URL for production (e.g., https://your-app.onrender.com)
// - NODE_ENV: Determines if we're in production or development
const getRedirectUri = () => {
  // Check for explicit redirect URI in environment variables first
  if (process.env.GOOGLE_REDIRECT_URI) {
    console.log('🔗 Using GOOGLE_REDIRECT_URI from env:', process.env.GOOGLE_REDIRECT_URI);
    return process.env.GOOGLE_REDIRECT_URI;
  }
  
  // Determine redirect URI based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production: Use frontend URL from environment or default to render.com
    const frontendUrl = process.env.FRONTEND_URL || 'https://rehearsal-scheduler-frontend.onrender.com';
    const redirectUri = `${frontendUrl}/(tabs)/profile`;
    console.log('🔗 Production redirect URI:', redirectUri);
    return redirectUri;
  } else {
    // Development: Use localhost
    const redirectUri = 'http://localhost:8081/(tabs)/profile';
    console.log('🔗 Development redirect URI:', redirectUri);
    return redirectUri;
  }
};

// Create OAuth2 client without redirect URI (will be set dynamically per request)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Generate Google OAuth URL
router.get('/auth/google', authenticateToken, async (req, res) => {
  try {
    const currentRedirectUri = getRedirectUri();
    console.log('🔗 Generating Google OAuth URL for user:', req.user.id);
    console.log('🔗 Current redirect URI:', currentRedirectUri);
    console.log('🔗 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      FRONTEND_URL: process.env.FRONTEND_URL,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
    });
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: req.user.id, // Pass user ID to identify user after callback
      redirect_uri: currentRedirectUri // Explicitly set the redirect URI
    });

    console.log('🔗 Generated auth URL:', authUrl);
    
    // Parse the URL to check what redirect_uri is actually being used
    try {
      const url = new URL(authUrl);
      const actualRedirectUri = url.searchParams.get('redirect_uri');
      console.log('🔗 Actual redirect_uri in URL:', actualRedirectUri);
      console.log('🔗 Expected redirect_uri:', currentRedirectUri);
      console.log('🔗 URLs match:', actualRedirectUri === currentRedirectUri);
    } catch (parseError) {
      console.log('🔗 Could not parse auth URL:', parseError.message);
    }
    
    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authentication URL' });
  }
});

// Legacy GET callback handler (deprecated - keeping for backward compatibility)
// NOTE: This endpoint is no longer used with the new redirect flow
router.get('/auth/google/callback', async (req, res) => {
  console.log('⚠️ Legacy GET callback handler called - this should not happen with the new redirect flow');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Deprecated Callback</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .warning { color: orange; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="warning">
        <h2>⚠️ Deprecated Callback</h2>
        <p>This callback method is deprecated. Please use the new redirect flow.</p>
        <p>Redirecting you back to the app...</p>
      </div>
      <script>
        setTimeout(() => {
          const frontendUrl = '${process.env.NODE_ENV === 'production' 
            ? (process.env.FRONTEND_URL || 'https://rehearsal-scheduler-frontend.onrender.com')
            : 'http://localhost:8081'}';
          window.location.href = frontendUrl;
        }, 3000);
      </script>
    </body>
    </html>
  `);
});

// Handle Google OAuth code exchange (POST - from frontend)
router.post('/auth/google/exchange-code', authenticateToken, async (req, res) => {
  try {
    const { code, state } = req.body;
    console.log('🔄 Processing OAuth code exchange for user:', req.user.id);
    console.log('📝 Code received (length):', code?.length || 0);
    console.log('📝 State received:', state);
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    // Set the redirect URI for token exchange
    const currentRedirectUri = getRedirectUri();
    console.log('🔄 Using redirect URI for token exchange:', currentRedirectUri);
    
    // Exchange the authorization code for tokens with the correct redirect URI
    const { tokens } = await oauth2Client.getToken({
      code: code,
      redirect_uri: currentRedirectUri
    });
    console.log('🎫 Received tokens from Google:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenType: tokens.token_type,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope
    });
    
    // Store tokens in user record
    await User.findByIdAndUpdate(req.user.id, {
      googleTokens: tokens,
      googleConnected: true
    });

    console.log(`✅ Google Calendar connected successfully for user: ${req.user.id}`);
    res.json({ success: true, message: 'Google Calendar connected successfully' });
  } catch (error) {
    console.error('Error exchanging OAuth code:', error);
    res.status(500).json({ error: 'Failed to connect Google Calendar' });  
  }
});

// Legacy POST callback endpoint (keeping for backward compatibility)
router.post('/auth/google/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const currentRedirectUri = getRedirectUri();
    console.log('🔄 Legacy callback: Using redirect URI for token exchange:', currentRedirectUri);
    
    const { tokens } = await oauth2Client.getToken({
      code: code,
      redirect_uri: currentRedirectUri
    });
    
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
    const weeklyAvailabilities = await WeeklyAvailability.find({}).sort({ dayOfWeek: 1, startTime: 1 });
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
    console.log(`🔌 Disconnecting Google Calendar for user: ${req.user.id}`);
    
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { 
        googleTokens: '',
        googleConnected: ''
      }
    });

    console.log(`✅ Google Calendar disconnected successfully for user: ${req.user.id}`);
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