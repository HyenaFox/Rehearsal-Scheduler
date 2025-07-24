# Google OAuth Setup Instructions

## The Problem
Your app shows "Access blocked: Rehearsal Scheduler has not completed the Google verification process" when trying to use Google Sign-In.

## Quick Fix for Testing (Immediate)

### Option 1: Add Test Users
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your "Rehearsal Scheduler" project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Scroll down to **Test users** section
5. Click **ADD USERS**
6. Add the email addresses that need access:
   - `sethhaypol@gmail.com`
   - Add any other testers you want
7. Click **SAVE**

Now those users can access Google Sign-In while your app is in testing mode.

## Production Solution (Long-term)

### Option 2: Publish Your App
1. In Google Cloud Console → **OAuth consent screen**
2. Click **PUBLISH APP**
3. Fill out the required information:
   - **App name**: Rehearsal Scheduler
   - **User support email**: Your email
   - **App logo**: Upload a logo (120x120px recommended)
   - **App domain**: Your domain
   - **Developer contact**: Your email
   - **Privacy Policy URL**: Required for public apps
   - **Terms of Service URL**: Required for public apps

### Required Documents
You'll need to create:
- Privacy Policy
- Terms of Service

### Review Process
- Google will review your app
- Can take several days to weeks
- They may ask for additional information

## Alternative: Disable Google Sign-In for Now

If you want to simplify things, you can temporarily hide the Google Sign-In button:

1. Edit `app/screens/LoginScreen.tsx`
2. Comment out or remove the Google Sign-In button
3. Users can still register/login with email/password

## Current Status

- ✅ Email/password login works perfectly
- ⚠️ Google Sign-In requires verification or test user setup
- ✅ App functionality is not affected

Choose Option 1 for quick testing or Option 2 for production use.
