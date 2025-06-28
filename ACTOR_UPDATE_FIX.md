# Actor Update Issue Summary

## Problem
- User can log in successfully
- User goes to Profile screen and sets isActor to true
- Profile update appears to succeed
- However, user does not appear in the actors list on the actors screen

## Root Cause Found
The backend was returning `{ message: '...', user: {...} }` but the frontend was expecting just the user object. This was fixed in `app/services/api.ts` by extracting the user from the response.

## Changes Made
1. **Fixed API Service Response Handling**: Modified `updateProfile` in `app/services/api.ts` to extract the user object from the backend response
2. **Added Debug Logging**: Enhanced logging in both AuthContext and AppContext to trace the profile update and actor list refresh flow
3. **Verified Backend Logic**: Confirmed that `/api/actors` correctly returns all users with `isActor: true`

## Current Status
- Fix applied to handle the response structure mismatch
- Debug logging added to trace the flow
- Ready to test the complete profile-to-actor flow

## Testing
Need to:
1. Go to Profile screen
2. Toggle "Actor Profile" to ON
3. Save profile
4. Check if user appears in actors list
5. Verify console logs show the correct flow
