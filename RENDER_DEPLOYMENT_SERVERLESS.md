# 🚀 Render.com Deployment Guide - Serverless Architecture

## 📋 Overview
Your Rehearsal Scheduler now uses a serverless architecture with direct MongoDB integration. This means you only need to deploy the frontend - no backend server required!

## 🔧 Current Configuration

### Environment Variables
Your `.env` file contains:
```env
EXPO_PUBLIC_MONGODB_URI=mongodb+srv://rehearsal-user:123@cluster0.ma5xhcl.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority&appName=Cluster0
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=857657662535-cd6capub87vghupi38g1fcar6hcch7ug.apps.googleusercontent.com
```

### Render.yaml Configuration
Your `render.yaml` is already configured for static deployment:
- **Type**: Static Site (no backend server)
- **Build Command**: `npm install && npm run build`
- **Publish Path**: `./dist`
- **Environment Variables**: MongoDB URI and Google OAuth configured

## 📦 Deployment Steps

### 1. Test Locally First
```bash
# Install dependencies
npm install

# Start development server
npm start

# Test the direct MongoDB connection
# Check browser console for connection logs
```

### 2. Build for Production
```bash
# Build the web version
npm run build

# Verify build output in ./dist folder
ls -la dist/
```

### 3. Deploy to Render.com

#### Option A: Automatic Deployment (Recommended)
1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Updated to serverless architecture with direct MongoDB"
   git push origin main
   ```

2. **Render will automatically deploy** if you have auto-deploy enabled

#### Option B: Manual Deployment
1. **Login to Render.com**
2. **Go to your service dashboard**
3. **Click "Manual Deploy"**
4. **Select "Deploy latest commit"**

### 4. Monitor Deployment
- Check the build logs in Render dashboard
- Look for successful build completion
- Verify environment variables are set correctly

## 🔍 Troubleshooting

### Common Issues & Solutions

#### 1. MongoDB Connection Errors
**Problem**: Can't connect to MongoDB
**Solution**:
- Verify MongoDB URI is correct in environment variables
- Check MongoDB Atlas network access (allow 0.0.0.0/0)
- Ensure database user has proper permissions

#### 2. Build Failures
**Problem**: Build fails on Render
**Solution**:
```bash
# Test build locally first
npm run build

# Check for any missing dependencies
npm install

# Verify Node.js version compatibility
node --version
```

#### 3. Environment Variables Not Found
**Problem**: App can't find environment variables
**Solution**:
- Check Render dashboard → Environment variables
- Ensure `EXPO_PUBLIC_MONGODB_URI` is set
- Restart the service after adding variables

## 🎯 Expected Behavior

### ✅ What Should Work
- Direct MongoDB connection from browser
- Actor management (create, read, update, delete)
- Scene management (globally accessible)
- Rehearsal scheduling
- Timeslot selection (5:00 PM - 11:00 PM, no Fridays)
- Offline fallback to local storage

### ⚠️ What's Different
- **No backend server** - all operations are client-side
- **Simple authentication** - uses local storage instead of JWT
- **Direct database access** - from React Native app to MongoDB
- **Faster loading** - no API calls, direct data access

## 📊 Monitoring & Maintenance

### 1. Check Deployment Status
- **Render Dashboard**: Monitor build and deployment logs
- **MongoDB Atlas**: Check connection and usage metrics
- **Browser Console**: Monitor client-side errors

### 2. Database Management
- **MongoDB Atlas Dashboard**: Monitor database performance
- **Collections**: Check `scenes`, `rehearsals`, `users` collections
- **Indexes**: Ensure proper indexing for performance

### 3. Performance Optimization
- **Bundle Size**: Monitor webpack bundle size
- **Load Times**: Check initial page load performance
- **Memory Usage**: Monitor client-side memory usage

## 🔐 Security Considerations

### Environment Variables
```env
# These are safe to expose (EXPO_PUBLIC_ prefix)
EXPO_PUBLIC_MONGODB_URI=mongodb+srv://...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

### Database Security
- MongoDB Atlas handles connection security
- Use strong database passwords
- Enable MongoDB Atlas IP whitelisting for production
- Consider MongoDB Realm for additional security

## 🚀 Next Steps

### 1. Test Your Deployment
Visit your Render.com URL and verify:
- [ ] App loads without errors
- [ ] MongoDB connection works
- [ ] Actor management functions
- [ ] Scene creation/editing works
- [ ] Rehearsal scheduling works
- [ ] Timeslot selection works

### 2. Remove Backend (Optional)
Since you no longer need the backend:
```bash
# Remove backend folder
rm -rf backend/

# Remove backend-related files
rm -f start-backend.bat
rm -f backend-related scripts
```

### 3. Update Documentation
- Update README with new architecture
- Remove backend setup instructions
- Add MongoDB setup instructions

## 📞 Support

If you encounter issues:
1. Check Render build logs
2. Check browser console for errors
3. Verify MongoDB Atlas connection
4. Test locally with `npm start`

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ Render shows "Live" status
- ✅ App loads at your Render URL
- ✅ MongoDB connection logs show success
- ✅ All CRUD operations work
- ✅ No console errors in browser

---

**🎭 Your Rehearsal Scheduler is now running serverless on Render.com with direct MongoDB integration!**
