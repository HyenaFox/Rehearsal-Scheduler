const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/auth');
const User = require('../models/User');
const GoogleCalendarService = require('../services/googleCalendar');

const googleCalendar = new GoogleCalendarService();

// Calendar API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Google Calendar Integration API',
    version: '1.0.0',
    endpoints: {
      'GET /auth/google': 'Start Google OAuth flow (requires auth)',
      'POST /auth/google/callback': 'Handle OAuth callback (requires auth)',
      'GET /status': 'Check Google Calendar connection status (requires auth)',
      'POST /check-timeslots': 'Check specific timeslots against calendar and update availability (requires auth)',
      'GET /available-slots': 'Get available time slots from calendar (requires auth)',
      'POST /import-slots': 'Import selected slots to profile (requires auth)',
      'DELETE /disconnect': 'Disconnect Google Calendar (requires auth)'
    },
    note: 'All endpoints except this one require authentication'
  });
});

// Start Google OAuth flow
router.get('/auth/google', auth, (req, res) => {
  try {
    const authUrl = googleCalendar.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Google auth URL error:', error);
    res.status(500).json({ error: 'Failed to generate Google auth URL' });
  }
});

// Handle Google OAuth callback
router.post('/auth/google/callback', auth, async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Exchange code for tokens
    const tokens = await googleCalendar.getTokens(code);
    
    // Set credentials for this request
    googleCalendar.setCredentials(tokens);
    
    // Get user info to verify the connection
    const googleUserInfo = await googleCalendar.getUserInfo();
    
    // Store Google tokens in user record (encrypted in production)
    await User.updateUser(req.userId, {
      googleCalendarTokens: tokens,
      googleEmail: googleUserInfo.email
    });

    res.json({ 
      success: true, 
      googleEmail: googleUserInfo.email,
      message: 'Google Calendar connected successfully' 
    });
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({ error: 'Failed to connect Google Calendar' });
  }
});

// Handle Google OAuth callback via GET (direct from Google)
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.error('Google OAuth error:', error);
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>Google Calendar Authorization Error</h1>
          <p>Error: ${error}</p>
          <p>Please close this window and try again.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `);
    }
    
    if (!code) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>OAuth Error</title></head>
        <body>
          <h1>Google Calendar Authorization Error</h1>
          <p>No authorization code received.</p>
          <p>Please close this window and try again.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
        </html>
      `);
    }

    // For GET requests, we can't authenticate the user directly
    // Instead, return a page that sends the code to the frontend
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Calendar Authorization</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #4CAF50; }
          .loading { color: #2196F3; }
        </style>
      </head>
      <body>
        <h1 class="loading">Google Calendar Authorization</h1>
        <p>Processing your Google Calendar connection...</p>
        <p>This window will close automatically.</p>
        
        <script>
          // Send the authorization code to the parent window/app
          const code = '${code}';
          
          // Try to communicate with parent window (for web app)
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'GOOGLE_OAUTH_SUCCESS', 
              code: code 
            }, '*');
            window.close();
          } 
          // Try to communicate with React Native WebView
          else if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'GOOGLE_OAUTH_SUCCESS', 
              code: code 
            }));
          }
          // For mobile app deep linking
          else {
            const redirectUrl = 'rehearsal-scheduler://oauth-callback?code=' + encodeURIComponent(code);
            window.location.href = redirectUrl;
          }
          
          // Fallback: close window after 3 seconds
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Google GET callback error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>OAuth Error</title></head>
      <body>
        <h1>Google Calendar Authorization Error</h1>
        <p>An error occurred while processing your authorization.</p>
        <p>Please close this window and try again.</p>
        <script>
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `);
  }
});

// Check specific timeslots against Google Calendar
router.post('/check-timeslots', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || !user.googleCalendarTokens) {
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    const { timeslots, dateRange = 30 } = req.body;
    
    if (!timeslots || !Array.isArray(timeslots)) {
      return res.status(400).json({ error: 'Timeslots array is required' });
    }

    // Set up Google Calendar with user's tokens
    googleCalendar.setCredentials(user.googleCalendarTokens);

    // Check timeslot availability against Google Calendar
    const availabilityResult = await googleCalendar.checkTimeslotAvailability(timeslots, dateRange);

    // Automatically update user's availability based on calendar
    const availableTimeslots = availabilityResult.timeslots
      .filter(slot => slot.isAvailable)
      .map(slot => slot.id);

    await User.updateUser(req.userId, {
      availableTimeslots: availableTimeslots
    });

    res.json({ 
      ...availabilityResult,
      updatedAvailability: true,
      availableTimeslotIds: availableTimeslots,
      message: `Availability updated based on Google Calendar. ${availableTimeslots.length}/${timeslots.length} timeslots are available.`
    });
  } catch (error) {
    console.error('Check timeslots error:', error);
    res.status(500).json({ error: 'Failed to check timeslot availability' });
  }
});

// Get available time slots from Google Calendar (legacy - generates new slots)
router.get('/available-slots', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || !user.googleCalendarTokens) {
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    // Set up Google Calendar with user's tokens
    googleCalendar.setCredentials(user.googleCalendarTokens);

    // Get date range (next 7 days by default)
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch calendar events
    const events = await googleCalendar.getCalendarEvents(timeMin, timeMax);
    
    // Calculate available slots
    const availableSlots = googleCalendar.calculateAvailableSlots(events);

    res.json({ 
      availableSlots,
      busyEventsCount: events.length,
      dateRange: { from: timeMin, to: timeMax }
    });
  } catch (error) {
    console.error('Available slots error:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// Import selected time slots to user profile
router.post('/import-slots', auth, async (req, res) => {
  try {
    const { selectedSlots } = req.body;
    
    if (!selectedSlots || !Array.isArray(selectedSlots)) {
      return res.status(400).json({ error: 'Selected slots are required' });
    }

    // Convert slots to the format expected by the app
    const timeslots = selectedSlots.map(slot => ({
      day: slot.day,
      time: slot.time,
      start: slot.start,
      end: slot.end
    }));

    // Update user's available timeslots
    const user = await User.updateUser(req.userId, {
      availableTimeslots: timeslots
    });

    res.json({ 
      success: true, 
      importedCount: timeslots.length,
      user: user
    });
  } catch (error) {
    console.error('Import slots error:', error);
    res.status(500).json({ error: 'Failed to import time slots' });
  }
});

// Disconnect Google Calendar
router.delete('/disconnect', auth, async (req, res) => {
  try {
    await User.updateUser(req.userId, {
      googleCalendarTokens: null,
      googleEmail: null
    });

    res.json({ success: true, message: 'Google Calendar disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Google Calendar' });
  }
});

// Get Google Calendar connection status
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const isConnected = !!(user && user.googleCalendarTokens);
    
    res.json({ 
      isConnected,
      googleEmail: isConnected ? user.googleEmail : null,
      hasAvailableSlots: user?.availableTimeslots?.length > 0
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get connection status' });
  }
});

module.exports = router;
