# MongoDB Atlas App Services (Realm) Setup Guide

## Overview

This guide shows how to set up MongoDB Atlas App Services (Realm) so your React Native app can connect directly to MongoDB without a backend server. This is the recommended approach for serverless MongoDB access.

## Step 1: Create a MongoDB Realm App

1. **Log in to MongoDB Atlas**
   - Go to <https://cloud.mongodb.com/>
   - Log in with your existing account

2. **Navigate to App Services**
   - In the left sidebar, look for "SERVICES" section
   - Click on "App Services" (it might be under a different section)
   - If you don't see "App Services", try these alternatives:
     - Look for "Atlas App Services"
     - Look for "Realm" in the sidebar
     - Check if there's a "Build" or "Developer Tools" section
     - Sometimes it's under "Data Services" > "App Services"

3. **Create a New App**
   - Look for a green button that says "Create a New App", "Build a New App", or "Create App"
   - Choose "Build your own App" or "Create from Template"
   - App Name: `rehearsal-scheduler-app`
   - Link Data Source: Select your existing cluster (`Cluster0`)
   - Environment: Choose "Global" (recommended)
   - Click "Create App"

## Step 2: Configure Authentication

1. **Enable Anonymous Authentication**
   - In your new App, go to "Authentication" in the left sidebar
   - Click on "Authentication Providers"
   - Click "Anonymous" and toggle it to "Enabled"
   - Click "Save"

## Step 3: Configure Database Access Rules

1. **Go to Rules**
   - Click on "Rules" in the left sidebar
   - Click on your database (`rehearsal-scheduler`)
   - For each collection (scenes, rehearsals, actors, timeslots):
     - Click "Add Collection"
     - Collection Name: `scenes` (repeat for each collection)
     - Template: "Users can read and write all data"
     - Click "Save"

## Step 4: Get Your App ID

1. **Copy App ID**
   - In your App Services dashboard, look for "App ID" at the top
   - It looks like: `rehearsal-scheduler-app-abcd1234`
   - Copy this App ID

## Step 5: Update Your Environment Variables

Add this to your `.env` file:

```env
EXPO_PUBLIC_REALM_APP_ID=your_app_id_here
```

## Step 6: Update Render.com Deployment

When you deploy to Render.com, add this environment variable:

- Key: `EXPO_PUBLIC_REALM_APP_ID`
- Value: Your MongoDB Realm App ID

## Step 7: Test the Connection

Run your test to verify everything works:

```bash
node test-direct-mongo.js
```

## What This Gives You

✅ **No backend server needed**  
✅ **Direct MongoDB connection from React Native**  
✅ **Works in browsers and mobile apps**  
✅ **Secure authentication**  
✅ **Lower hosting costs**  
✅ **Simpler deployment**  

## Security Notes

- Anonymous authentication is secure for this use case
- You can add more authentication providers later
- Database rules control what data can be accessed
- App ID is safe to use in client-side code

## Next Steps

Once you have your App ID:

1. Add it to your `.env` file
2. Test the connection
3. Deploy to Render.com with the new environment variable
4. Remove the backend folder (no longer needed!)

## Resources

- [MongoDB App Services Documentation](https://docs.mongodb.com/realm/web/)
- [Realm Web SDK Documentation](https://docs.mongodb.com/realm/web/mongodb/)

## Troubleshooting

**Can't find App Services?**

The MongoDB Atlas UI changes frequently. Try these locations:

- Look for "App Services" in the left sidebar
- Check under "SERVICES" section in the sidebar
- Try "Atlas App Services"
- Look for "Realm" in the sidebar
- Check if there's a "Build" or "Developer Tools" section
- Sometimes it's under "Data Services" > "App Services"
- Look for any button that says "Create App" or "Build App"

**Current Atlas UI (2025):**

- The interface may show "Data Services" and "Charts" tabs at the top
- App Services might be in a different location than shown in older tutorials
- Look for anything related to "Apps", "Realm", or "App Services"

**Still can't find it?**

Try this alternative approach:

1. Go to the MongoDB Atlas homepage
2. Look for "Products" or "Services" in the main navigation
3. Find "App Services" or "Atlas App Services"
4. This should take you to the App Services section

**Authentication issues?**

- Make sure Anonymous auth is enabled
- Check your database rules allow read/write access

**Need help?**

- The Realm Web SDK is widely used and well-documented
- This is the recommended approach for React Native + MongoDB
- MongoDB's documentation is at: <https://docs.mongodb.com/realm/web/>
