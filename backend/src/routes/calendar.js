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

// Get available time slots from Google Calendar
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
