# Quick Deployment Checklist

## Pre-Deployment Verification

✅ **Test locally first:**
```bash
cd backend
npm install
node check.js  # Should show "✅ App syntax check passed"
```

✅ **Files ready for deployment:**
- [ ] `backend/package.json` - Updated with TypeScript support
- [ ] `backend/src/app.js` - Main application file
- [ ] `backend/tsconfig.json` - TypeScript configuration
- [ ] `backend/.gitignore` - Excludes node_modules and .env

## Render.com Deployment Steps

### 1. Database Setup
- [ ] Create PostgreSQL database on Render
- [ ] Copy the DATABASE_URL connection string
- [ ] Keep it secure - don't commit to Git

### 2. Web Service Setup
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set Root Directory: `backend` (if using full repo)
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`

### 3. Environment Variables
- [ ] `NODE_ENV` = `production`
- [ ] `DATABASE_URL` = (your PostgreSQL connection string)
- [ ] `JWT_SECRET` = (generate with: `openssl rand -hex 32`)

### 4. Deploy & Test
- [ ] Deploy the service
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Test health endpoint: `https://your-service.onrender.com/health`
- [ ] Should return: `{"status":"OK","timestamp":"..."}`

## If Deployment Fails

### Error Code 1 (Build Failed)
- Check build logs for specific error messages
- Verify package.json syntax
- Try rebuilding with "Clear build cache" option

### Database Connection Errors
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Check if database service is running
- Database tables are created automatically on first successful connection

### Service Won't Start
- Check if PORT environment variable conflicts
- Verify all required dependencies are in `dependencies` (not `devDependencies`)
- Review startup logs in Render dashboard

## Success Indicators

✅ **Build completes successfully**
✅ **Service shows "Live" status**  
✅ **Health endpoint responds with 200 OK**
✅ **Database tables created automatically**
✅ **Ready to update React Native app with API URL**

## Next Steps After Successful Deployment

1. **Note your API URL:** `https://your-service-name.onrender.com`
2. **Update React Native app:** Edit `app/services/api.ts` with your URL
3. **Update AuthContext:** Replace local storage with API calls
4. **Test end-to-end:** Register → Login → Update Profile → Verify sync
