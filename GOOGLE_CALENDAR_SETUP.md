# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration for the Rehearsal Scheduler app.

## Backend Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields (App name, User support email, Developer contact email)
   - Add scopes: `../auth/calendar.readonly` and `../auth/userinfo.email`
   - Add your email as a test user
4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "Rehearsal Scheduler"
   - Authorized redirect URIs: 
     - `http://localhost:3000/api/calendar/auth/google/callback` (for development)
     - Your production URL + `/api/calendar/auth/google/callback` (for production)

### 3. Configure Environment Variables

Update your `backend/.env` file with the credentials from Google Cloud Console:

```bash
GOOGLE_CLIENT_ID=your-actual-client-id-from-google-console
GOOGLE_CLIENT_SECRET=your-actual-client-secret-from-google-console
GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/auth/google/callback
```

**Important**: Replace the placeholder values with your actual Google OAuth credentials.

## Frontend Setup

The frontend is already configured to handle Google OAuth through the `GoogleCalendarIntegration` component. No additional setup is required on the frontend side.

## How It Works

### Authentication Flow

1. User clicks "Connect Google Calendar" in their profile
2. Frontend requests OAuth URL from backend
3. User is redirected to Google's consent page
4. After consent, Google redirects back to the app with an authorization code
5. Frontend sends the code to the backend
6. Backend exchanges the code for access tokens
7. Tokens are stored in the user's profile in the database

### Calendar Import Flow

1. Backend uses stored tokens to fetch calendar events from Google Calendar
2. Available time slots are calculated based on free time between events
3. User can select which time slots to import
4. Selected slots are added to the user's profile as available timeslots

## API Endpoints

The following API endpoints are available for Google Calendar integration:

- `GET /api/calendar/auth/google` - Get Google OAuth URL
- `POST /api/calendar/auth/google/callback` - Handle OAuth callback
- `GET /api/calendar/status` - Check connection status
- `GET /api/calendar/available-slots` - Get available time slots
- `POST /api/calendar/import-slots` - Import selected slots
- `DELETE /api/calendar/disconnect` - Disconnect Google Calendar

## Security Notes

1. **Token Storage**: In production, consider encrypting Google tokens before storing them in the database
2. **Refresh Tokens**: The implementation handles token refresh automatically
3. **Scopes**: Only readonly calendar access is requested for security
4. **HTTPS**: Use HTTPS in production for secure token exchange

## Testing

To test the integration:

1. Make sure the backend server is running with proper environment variables
2. Open the app and go to Profile screen
3. Enable "Actor Profile" toggle
4. You should see the "Google Calendar Integration" section
5. Click "Connect Google Calendar" to test the OAuth flow

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**: 
   - Check that your redirect URI in Google Console matches exactly with `GOOGLE_REDIRECT_URI` in your .env file

2. **"invalid_client" error**:
   - Verify that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

3. **"access_denied" error**:
   - User cancelled the OAuth flow or your app is not approved for production use

4. **Backend connection issues**:
   - Make sure the backend server is running on the correct port
   - Check that the API_BASE_URL in the frontend matches your backend URL

### Development vs Production

- **Development**: Use `http://localhost:3000` for redirect URI
- **Production**: Use your production domain with HTTPS

## Future Enhancements

Potential improvements for the Google Calendar integration:

1. **Multiple Calendar Support**: Allow users to select which calendars to sync
2. **Two-way Sync**: Write rehearsal events back to Google Calendar
3. **Real-time Updates**: Use webhooks to sync changes in real-time
4. **Recurring Events**: Better handling of recurring calendar events
5. **Timezone Support**: Handle different timezones properly
