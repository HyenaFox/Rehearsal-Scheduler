# Google Calendar Integration Fix Guide

## Current Status

The Google Calendar integration is **already implemented** but needs proper configuration and minor fixes to work correctly. Here's what I found:

### ✅ What's Already Working:
- Google OAuth libraries installed (`google-auth-library`, `googleapis`)
- Backend routes implemented (`/api/calendar/*`)
- Frontend component (`GoogleCalendarIntegration.tsx`)
- Database models support Google tokens
- OAuth flow with popup window handling

### ❌ Issues Found:
1. **Missing environment variables** - Google OAuth credentials not configured
2. **Dependencies were not installed** (now fixed)
3. **Minor bugs in OAuth callback handling**
4. **Redirect URI configuration needed**

## Step-by-Step Fix Guide

### 1. Set Up Google Cloud Project

First, you need to create and configure a Google Cloud Project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Calendar API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set up authorized redirect URIs:
   - For local development: `http://localhost:3000/api/calendar/auth/google/callback`
   - For production: `https://your-backend-domain.com/api/calendar/auth/google/callback`
5. Save the **Client ID** and **Client Secret**

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Backend environment variables
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/auth/google/callback

# For production, update GOOGLE_REDIRECT_URI to your production backend URL
```

### 4. Frontend Environment Variables

Create a `.env` file in the root directory (same level as `app.json`):

```bash
# Frontend environment variables
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id_here
```

### 5. Fix OAuth Callback Issue

The current implementation has a small bug in the calendar route. Here's the fix:

**File: `backend/src/routes/calendar.js` - Line 214**

The line:
```javascript
const { tokens } = await oauth2Client.getAccessToken(code);
```

Should be:
```javascript
const { tokens } = await oauth2Client.getToken(code);
```

### 6. CORS Configuration

Ensure your backend allows requests from your frontend. In `backend/src/app.js`, make sure CORS is configured properly:

```javascript
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:19006',
    'exp://localhost:19000',
    // Add your production frontend URL here
  ],
  credentials: true
}));
```

### 7. Test the Integration

1. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   npm start
   ```

3. **Test the flow**:
   - Login to the app
   - Go to Profile screen
   - Click "Connect to Google Calendar"
   - Complete OAuth flow
   - Click "Import Availability"

### 8. Production Deployment

For production deployment, update these URLs:

1. **Google Cloud Console**: Add your production redirect URI
2. **Backend .env**: Update `GOOGLE_REDIRECT_URI` to production URL
3. **Frontend .env**: Update `EXPO_PUBLIC_API_URL` to production backend URL

## Common Issues & Solutions

### Issue: "Popup blocked"
**Solution**: Ensure popups are allowed in browser settings

### Issue: "OAuth redirect URI mismatch"
**Solution**: Verify the redirect URI in Google Cloud Console matches exactly with your backend URL

### Issue: "Calendar not connected" after successful OAuth
**Solution**: Check that tokens are being saved to database correctly. Look at browser console and server logs.

### Issue: "No available timeslots found"
**Solution**: The import logic currently returns all timeslots as available. You may need to implement more sophisticated calendar conflict checking.

## Advanced Configuration

### Custom Calendar Logic

The current implementation marks all timeslots as available. To implement proper busy time checking:

1. Modify the `/calendar/import-availability` endpoint
2. Add logic to compare timeslot times with calendar events
3. Consider recurring events and time zones

### Multiple Calendar Support

To support multiple calendars:
1. Modify the calendar list query to include secondary calendars
2. Update the UI to allow calendar selection
3. Store calendar preferences in user model

## Testing Commands

```bash
# Test backend health
curl http://localhost:3000/health

# Test calendar auth endpoint (requires valid JWT)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/api/calendar/auth/google

# Check environment variables
cd backend && node -e "console.log(process.env.GOOGLE_CLIENT_ID ? 'Google Client ID set' : 'Missing Google Client ID')"
```

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use environment-specific redirect URIs**
3. **Implement token refresh logic** for long-term usage
4. **Add proper error handling** for expired tokens
5. **Consider implementing calendar webhook subscriptions** for real-time updates

---

**Next Steps:**
1. Set up Google Cloud Project and get OAuth credentials
2. Configure environment variables
3. Apply the small code fix mentioned above
4. Test the integration end-to-end
5. Deploy with production URLs

The integration should work perfectly once these configuration steps are completed!