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
       - `DATABASE_URL` = (paste your PostgreSQL connection string)
       - `JWT_SECRET` = (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

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

Would you like me to help you with any specific part of this process?
