# Complete Deployment Guide for Rehearsal Scheduler

## Summary

The error you encountered happened because you tried to deploy your React Native app directly to Render.com. React Native apps run on mobile devices, not web servers. Here's the correct architecture:

**React Native App** (mobile) ↔ **Backend API** (Render.com) ↔ **Database** (PostgreSQL)

## Step-by-Step Deployment

### 1. Deploy Backend to Render.com

1. **Create a GitHub repository** for your backend:
   - Push the `backend` folder to a new GitHub repo
   - Or push your entire project (Render can deploy from a subfolder)

2. **Sign up for Render.com** and connect your GitHub account

3. **Create a PostgreSQL database:**
   - In Render dashboard, click "New +"
   - Select "PostgreSQL"
   - Choose "Free" plan
   - Name it "rehearsal-scheduler-db"
   - Save the connection string (starts with `postgresql://`)

4. **Create a Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - If using entire repo: Set "Root Directory" to `backend`
   - Configure:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Environment Variables:**
       - `NODE_ENV` = `production`
       - `MONGODB_URI` = mongodb+srv://username:password@cluster.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority
       - `JWT_SECRET` = 05173863acda0d0d12d31c43bda699b64d913e16d1e4b29da14c1355ec7b57d0

5. **Deploy** - Render will build and deploy your API

### 2. Get Your API URL

After deployment, your API will be available at:
`https://your-service-name.onrender.com`

Test it by visiting: `https://your-service-name.onrender.com/health`

### 3. Update React Native App

Update the API URL in your React Native app:

1. **Edit `app/services/api.ts`:**
   ```typescript
   const API_BASE_URL = __DEV__ 
     ? 'http://localhost:3000/api' 
     : 'https://YOUR-SERVICE-NAME.onrender.com/api'; // Replace with your actual URL
   ```

2. **Update AuthContext** to use the API service instead of local storage

### 4. Test Your App

1. **Test locally first:**
   - Run your backend locally: `cd backend && npm run dev`
   - Test with your React Native app
   
2. **Test with deployed API:**
   - Update the API URL
   - Test registration, login, and profile updates

## Key Benefits

✅ **Users can create accounts** that persist across devices
✅ **Login from anywhere** with email/password
✅ **Edit availability and scenes** - changes sync to the database  
✅ **Add themselves to cast** - updates reflect for all users
✅ **Data consistency** across all app instances

## Free Tier Limitations

**Render.com Free Plan:**
- API sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- 750 hours/month (enough for moderate usage)

**Upgrade considerations:**
- For production use, consider the $7/month plan for always-on service

## Files Created

I've created a complete backend API for you:

```
backend/
├── src/
│   ├── app.js              # Main Express app
│   ├── models/
│   │   ├── database.js     # Database connection & schema
│   │   └── User.js         # User model with methods
│   ├── routes/
│   │   ├── auth.js         # Authentication endpoints
│   │   └── actors.js       # Actor management endpoints
│   └── middleware/
│       └── auth.js         # JWT authentication middleware
├── package.json            # Dependencies and scripts
├── .env.example           # Environment variables template
├── render.yaml            # Render.com deployment config
└── README.md              # Detailed documentation
```

Plus:
- `app/services/api.ts` - API service layer for your React Native app

## Next Steps

1. **Deploy the backend** following the steps above
2. **Get your API URL** from Render.com
3. **Update your React Native app** to use the API
4. **Update AuthContext** to use API calls instead of local storage
5. **Test thoroughly** with multiple devices/accounts

## Troubleshooting

### TypeScript Compatibility Error (Code 1)

If deployment fails with "code 1" due to TypeScript compatibility issues:

**Solution Applied:** I've updated the backend to include TypeScript support without requiring compilation:

1. **Added TypeScript as devDependency** - Provides type definitions for better compatibility
2. **Updated package.json** - More resilient build scripts 
3. **Simplified build command** - Uses standard `npm install`
4. **Added syntax verification** - Ensures code is valid before deployment

**Verification Steps:**
```bash
cd backend
npm install        # Should complete without errors
node check.js      # Should show "✅ App syntax check passed"
```

If you still see issues:
1. **Check Node.js version** - Ensure you're using Node 18+ (set in `engines` field)
2. **Clear npm cache** - Run `npm cache clean --force`
3. **Try minimal build** - Use just `npm install` as build command in Render

### Database Connection Issues

If you see database connection errors:
1. **Verify DATABASE_URL** - Should start with `postgresql://`
2. **Check database status** - Ensure your Render PostgreSQL service is running
3. **Wait for initialization** - Database tables are created automatically on first run

### Free Tier Cold Starts

**Expected behavior:**
- First request after 15 minutes takes ~30 seconds (service waking up)
- Subsequent requests are fast
- This is normal for Render's free tier

Would you like me to help you with any specific part of this process?
