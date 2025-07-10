# Direct MongoDB Integration - Serverless Architecture

## Overview
This implementation removes the backend server entirely and integrates MongoDB directly into the React Native app. This eliminates the need for a separate backend server while maintaining all functionality.

## Architecture Changes

### Before (Backend Server)
```
React Native App ← HTTP API → Backend Server ← MongoDB
```

### After (Direct MongoDB)
```
React Native App ← Direct MongoDB Client → MongoDB
```

## Key Components

### 1. DirectMongoService (`app/services/directMongo.js`)
- Handles all database operations directly from the React Native app
- Provides fallback to AsyncStorage for offline/local use
- Implements CRUD operations for:
  - Scenes (global and public)
  - Rehearsals (global and public)
  - Actors
  - Timeslots (client-side generated)

### 2. Updated ApiService (`app/services/api.ts`)
- Refactored to use DirectMongoService instead of HTTP requests
- Maintains the same interface for compatibility
- Implements simple local authentication system
- Removes all network-dependent operations

### 3. Environment Configuration
- `EXPO_PUBLIC_MONGODB_URI` - MongoDB connection string
- Removes dependency on `EXPO_PUBLIC_API_URL`

## Features Maintained

### ✅ Completed
- ✅ All CRUD operations for scenes, rehearsals, and actors
- ✅ Global and public access (no authentication required)
- ✅ Timeslot system (5:00 PM - 11:00 PM, no Fridays)
- ✅ Local storage fallback
- ✅ Modern UI and design system
- ✅ Segment-based timeslot selection

### ⚠️ Simplified
- **Authentication**: Now uses local storage instead of JWT tokens
- **Google Calendar**: Placeholder implementation (future feature)
- **User Management**: Simplified to local storage

## Benefits

1. **Simplified Architecture**: No backend server to maintain
2. **Reduced Infrastructure**: Only MongoDB required
3. **Faster Development**: No API layer to maintain
4. **Offline Support**: AsyncStorage fallback
5. **Direct Data Access**: No network latency for local operations

## Configuration Required

### 1. MongoDB Setup
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Update `.env` file:
   ```
   EXPO_PUBLIC_MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority
   ```

### 2. Environment Variables
The app now only requires:
- `EXPO_PUBLIC_MONGODB_URI` - MongoDB connection string
- Google OAuth variables (if using Google Calendar integration)

## File Structure Changes

### Modified Files
- `app/services/api.ts` - Refactored to use DirectMongoService
- `app/services/directMongo.js` - New direct MongoDB service
- `.env` - Added MongoDB URI configuration

### Files to Remove (Backend)
- `backend/` - Entire backend folder can be removed
- `start-backend.bat` - Backend startup script
- All backend-related scripts and configurations

## Next Steps

1. **Configure MongoDB**: Set up MongoDB Atlas and update connection string
2. **Test Integration**: Verify all CRUD operations work
3. **Remove Backend**: Delete backend folder and related files
4. **Update Documentation**: Update README and deployment guides
5. **Test Offline Mode**: Verify AsyncStorage fallback works

## Deployment

With direct MongoDB integration:
- **Frontend**: Deploy to Expo/EAS or web hosting
- **Database**: MongoDB Atlas (cloud) or self-hosted MongoDB
- **No Backend Server Required**

## Security Considerations

- MongoDB connection string should be properly secured
- Consider using MongoDB Realm for additional security layers
- Implement proper data validation on the client side
- Use environment variables for sensitive configuration

## Future Enhancements

1. **MongoDB Realm**: For advanced security and offline sync
2. **Google Calendar Integration**: Direct OAuth integration
3. **Real-time Updates**: MongoDB Change Streams
4. **Data Validation**: Client-side schema validation
5. **Caching**: Enhanced local caching strategies
