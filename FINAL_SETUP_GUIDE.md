# 🚀 Rehearsal Scheduler - Final Setup Guide

## 🎯 **Ready to Use!**

Your Rehearsal Scheduler app is now fully configured and ready to run. Here's everything you need to know:

## 📋 **Quick Start**

### **1. Start the Backend Server**

**This is the most important step!**

```bash
# Option 1: Double-click the batch file
start-backend.bat

# Option 2: Manual command
cd backend
npm start

# Option 3: PowerShell
.\start-backend.ps1
```

**Wait for this output:**
```
✅ Connected to MongoDB successfully
🚀 Server running on port 3000
```

### **2. Start the Frontend App**

```bash
# In the main directory
npm start
# or
expo start
```

## 🔧 **What's Been Fixed**

### **✅ Architecture Transition**
- **FROM**: React Native → Direct MongoDB (unreliable)
- **TO**: React Native → Backend API → MongoDB (reliable)

### **✅ Service Layer**
- Removed problematic direct MongoDB code
- Removed Firebase dependencies
- Updated all services to use backend API
- Fixed double `/api/api/` prefix bug

### **✅ Configuration**
- `.env` configured for backend API
- `backend/.env` configured for MongoDB
- `render.yaml` ready for deployment

### **✅ Import/Module Errors**
- Removed all direct MongoDB imports
- Fixed file extension issues
- Cleared Metro/Expo cache

## 🧪 **Testing**

### **Test Backend Connection**
```bash
# Test all endpoints
node test-backend-endpoints.js

# Test specific components
cd backend
node test-backend-connection.js
node test-mongo-connection.js
```

### **Test Frontend**
1. ✅ Start backend server
2. ✅ Start frontend app
3. ✅ Navigate to different tabs
4. ✅ Test data loading

## 📁 **Key Files**

### **Frontend Services**
- `app/services/directMongo.js` - Backend API calls
- `app/services/api.ts` - Main API service
- `app/contexts/AppContext.tsx` - Data loading logic

### **Backend**
- `backend/src/app.js` - Main server
- `backend/src/models/database.js` - MongoDB connection
- `backend/src/routes/` - API endpoints

### **Configuration**
- `.env` - Frontend config (API URL)
- `backend/.env` - Backend config (MongoDB URI)
- `render.yaml` - Deployment config

## 📱 **App Features**

### **Available Screens**
- **Scenes**: View and manage rehearsal scenes
- **Timeslots**: View available time slots
- **Profile**: User profile and settings
- **Auth**: Login/registration

### **Database Collections**
- **Scenes**: Theatre scenes with cast requirements
- **Actors**: Cast members and their availability
- **Timeslots**: Available rehearsal times
- **Rehearsals**: Scheduled rehearsal sessions

## 🌐 **Deployment**

### **To Render.com**
1. Push your code to GitHub
2. Connect your repository to Render
3. Both frontend and backend will deploy automatically
4. Environment variables are configured

### **Environment Variables**
- **Frontend**: `EXPO_PUBLIC_API_URL` (backend URL)
- **Backend**: `MONGODB_URI` (MongoDB connection string)

## 🛠️ **Troubleshooting**

### **Data Not Loading?**
1. ✅ Check backend server is running
2. ✅ Check MongoDB connection in backend logs
3. ✅ Verify `.env` file has correct API URL

### **Backend Won't Start?**
1. ✅ Run `npm install` in backend directory
2. ✅ Check MongoDB Atlas connection string
3. ✅ Verify environment variables

### **App Crashes?**
1. ✅ Clear cache: `expo start --clear`
2. ✅ Check for import errors
3. ✅ Verify backend is responding

## 📞 **Support Commands**

### **Clear Everything**
```bash
# Clear Metro cache
expo start --clear

# Clear node_modules
rm -rf node_modules
npm install

# Clear backend cache
cd backend
rm -rf node_modules
npm install
```

### **Check Status**
```bash
# Check if backend is running
netstat -ano | findstr :3000

# Test backend manually
curl http://localhost:3000/api

# Check MongoDB connection
cd backend
node test-mongo-connection.js
```

## 🎭 **Development Workflow**

### **Daily Development**
1. Start backend: `start-backend.bat`
2. Start frontend: `npm start`
3. Develop and test
4. Commit changes

### **Before Deployment**
1. Test all endpoints
2. Clear caches
3. Update environment variables
4. Push to GitHub

---

## 🎉 **You're Ready to Go!**

Your Rehearsal Scheduler app is now:
- ✅ **Stable** - Backend-based architecture
- ✅ **Reliable** - No direct MongoDB complexity
- ✅ **Deployable** - Ready for production
- ✅ **Maintainable** - Clear separation of concerns

**Just start the backend server and then the app!**

---

*Created: ${new Date().toISOString()}*
