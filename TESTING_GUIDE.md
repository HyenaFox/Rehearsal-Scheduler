# 🧪 API Testing Guide

This directory contains several test files to check your API backend and Google Auth functionality. Choose the approach that works best for you!

## 🚀 Quick Start (Recommended)

### Option 1: Quokka.js Live Testing (Best for VS Code)
1. **Install Quokka.js extension** in VS Code
2. **Open** `api-health-check.js`
3. **Update API_URL** at the top of the file to match your backend
4. **Press** `Ctrl+Shift+P` → "Quokka.js: Start on Current File"
5. **Watch** live results appear next to your code! ⚡

**Pros:** ✅ Live results, visual feedback, no setup required
**Best for:** Quick debugging, real-time API monitoring

### Option 2: Advanced Quokka Testing
1. Open `quokka-api-test.js`
2. Update `API_BASE_URL` in the file
3. Run with Quokka.js (same steps as above)

**Pros:** ✅ More comprehensive tests, detailed reporting
**Best for:** Thorough API validation

## 📋 Full Test Suite (Jest)

### Setup Jest Testing
```bash
# Install dependencies
npm install --save-dev jest node-fetch

# Add to package.json scripts:
"test": "jest",
"test:api": "jest __tests__/api-backend.test.js"

# Run tests
npm test
```

**Pros:** ✅ Professional testing, CI/CD ready, comprehensive coverage
**Best for:** Production apps, team development

## 🔧 What Each File Tests

### `api-health-check.js` (Simple & Visual)
- ✅ Basic connectivity
- ✅ Auth endpoint validation  
- ✅ Data endpoint checks
- ✅ Performance testing
- ✅ Google Auth configuration

### `quokka-api-test.js` (Comprehensive)
- ✅ All of the above plus:
- ✅ Error handling validation
- ✅ Environment detection
- ✅ Detailed status reporting

### `__tests__/api-backend.test.js` (Professional)
- ✅ Full Jest test suite
- ✅ Integration testing
- ✅ Multiple concurrent request testing
- ✅ Edge case validation

## 🌐 API URL Configuration

Update the API URL in your chosen test file:

```javascript
// For local development:
const API_URL = 'http://localhost:3000/api';

// For Android emulator (recommended for Google OAuth):
const API_URL = 'http://10.0.2.2:3000/api';

// For production:
const API_URL = 'https://your-app.onrender.com/api';
```

## 🔍 What to Expect

### ✅ Healthy API Response:
```
🧪 API Health Check Starting...
1. 🔌 Testing Connection...
   Status: 200 OK
   ✅ API is online!

2. 🔐 Testing Auth Endpoints...
   Login test: 401
   ✅ Login endpoint working

📊 HEALTH CHECK SUMMARY
Tests Passed: 5/5
Success Rate: 100%
🎉 All systems go!
```

### ❌ Common Issues:

**Connection Failed:**
- Backend not running → Run `npm run backend`
- Wrong URL → Update API_URL in test file
- Firewall blocking → Check network settings

**Auth Tests Failing:**
- Normal if auth not set up yet
- Check backend auth routes

**401 Responses:**
- Normal for protected endpoints
- Indicates proper security

## 🚨 Troubleshooting

### Backend Not Running?
```bash
cd backend
npm install
npm run dev
```

### Wrong API URL?
Check your `.env` file or update the URL in test files.

### Quokka Not Working?
1. Install Quokka.js extension
2. Make sure you're using the "Start on Current File" command
3. Check VS Code output panel for errors

### Jest Tests Failing?
```bash
# Check Node.js version (needs 16+)
node --version

# Install missing dependencies
npm install --save-dev jest node-fetch

# Run specific test
npm test __tests__/api-backend.test.js
```

## 🎯 Quick Commands

```bash
# Start backend
npm run backend

# Test with Quokka (VS Code)
# → Open api-health-check.js
# → Ctrl+Shift+P → "Quokka.js: Start on Current File"

# Test with Jest
npm test

# Run both frontend and backend
npm run dev
```

## 📊 Understanding Results

- **✅ Green/Pass:** Everything working
- **⚠️ Yellow/Warning:** Working but needs attention  
- **❌ Red/Fail:** Needs fixing
- **🔒 Lock:** Requires authentication (normal)
- **💥 Explosion:** Connection/server error

Happy testing! 🚀
