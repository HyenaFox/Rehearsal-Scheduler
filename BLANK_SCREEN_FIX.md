# 🛠️ Troubleshooting Guide - Blank Screen Fix

## ✅ **Problem Solved!**

The blank screen was caused by several issues that have now been fixed:

### 🔧 **Issues Fixed:**

1. **Package Version Mismatches**
   - Updated all Expo packages to compatible versions
   - Fixed using `npx expo install --fix`

2. **API Configuration**
   - Fixed environment variable loading 
   - Now properly uses `EXPO_PUBLIC_API_URL=http://localhost:3000/api`

3. **Port Conflicts**
   - Backend now running on port 3000
   - Frontend now running on port 8081
   - No more "address already in use" errors

4. **Cache Issues**
   - Started with `--clear` flag to clear Metro bundler cache
   - This fixes stale compilation issues

### 🚀 **Current Status:**

**Backend:** ✅ Running on http://localhost:3000
- Database connected successfully
- Google OAuth configured
- API endpoints ready

**Frontend:** ✅ Running on http://localhost:8081
- All packages updated and compatible
- Clean cache loaded
- Ready for testing

### 🧪 **How to Test:**

1. **Basic App Load:**
   - Open http://localhost:8081 in browser
   - Should see the main app interface (no blank screen)
   - Should see tabs at bottom: Rehearsals, Scenes, Timeslots, Profile

2. **Authentication Flow:**
   - Go to Profile tab
   - Should see "Welcome, Guest!" interface
   - Click "Sign In / Register" button
   - Modal should open with login form

3. **Google Sign-In (Web):**
   - In login modal, click "Continue with Google"
   - Should open Google OAuth popup
   - Complete Google authentication
   - Modal should close, Profile should show user data

### 🔄 **If You Get Blank Screen Again:**

Run this sequence:
```bash
# Kill any existing processes
taskkill /F /IM node.exe /T

# Start backend
cd backend
npm run dev

# Wait for backend to start, then start frontend
cd ..
npx expo start --web --clear
```

### 🎯 **Key Commands:**

**Start Development:**
```bash
# Terminal 1 (Backend)
cd backend && npm run dev

# Terminal 2 (Frontend)
npx expo start --web --clear
```

**If Ports Are Busy:**
```bash
taskkill /F /IM node.exe /T
# Then restart as above
```

**Update Packages:**
```bash
npx expo install --fix
```

The app should now load correctly and both Google Sign-In features should work! 🎉
