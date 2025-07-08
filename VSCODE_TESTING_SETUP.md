# 🧪 VS Code Testing Setup Guide

To show your tests in the VS Code Testing tab, follow these steps:

## 📦 Step 1: Install Dependencies

Run this command in your project root:

```bash
npm install --save-dev jest node-fetch
```

## 🔌 Step 2: Install VS Code Extensions

Install these extensions in VS Code:

1. **Jest** by Orta
   - Extension ID: `Orta.vscode-jest`
   - Provides Jest integration with VS Code Testing tab

2. **Jest Runner** by firsttris (optional)
   - Extension ID: `firsttris.vscode-jest-runner`
   - Adds run/debug buttons to individual tests

3. **Test Explorer UI** (may be included automatically)
   - Shows tests in the Testing sidebar

## ⚙️ Step 3: Configuration Files (Already Created)

The following files have been set up for you:

- ✅ `package.json` - Added test scripts
- ✅ `jest.config.json` - Jest configuration
- ✅ `jest.setup.js` - Test setup file
- ✅ `.vscode/settings.json` - VS Code Jest settings
- ✅ `__tests__/api.test.js` - Main test file

## 🚀 Step 4: Access the Testing Tab

1. **Open VS Code Testing Panel:**
   - Click the beaker/flask icon in the Activity Bar (left sidebar)
   - Or press `Ctrl+Shift+T` (Windows/Linux) or `Cmd+Shift+T` (Mac)
   - Or View → Testing

2. **You should see:**
   ```
   📁 REHEARSAL-SCHEDULER
   ├── 🌐 API Connectivity
   │   ├── should connect to health endpoint
   │   └── should return 200 for health check
   ├── 🔐 Authentication  
   │   ├── should reject invalid login credentials
   │   └── should handle registration requests
   ├── 📊 Data Endpoints
   │   ├── actors endpoint should be reachable
   │   ├── timeslots endpoint should be reachable
   │   └── scenes endpoint should be reachable
   ├── 🔍 Google Auth
   │   ├── google auth endpoint should exist
   │   └── should return valid google auth URL
   ├── ⚡ Performance
   │   └── should respond within 5 seconds
   └── 🛡️ Error Handling
       ├── should return 404 for invalid endpoints
       └── should handle malformed requests
   ```

## 🎮 Step 5: Running Tests

### From VS Code Testing Tab:
- **Run All Tests:** Click the play button at the top
- **Run Single Test:** Click the play button next to any test
- **Debug Test:** Click the debug button next to any test
- **Watch Mode:** Click the "Auto" toggle for continuous testing

### From Terminal:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 🔧 Troubleshooting

### ❌ Tests not showing in VS Code?

1. **Restart VS Code** after installing extensions
2. **Reload the window:** `Ctrl+Shift+P` → "Developer: Reload Window"
3. **Check Jest extension is active:** Look for Jest status in bottom status bar
4. **Verify file structure:** Tests should be in `__tests__/` folder with `.test.js` extension

### ❌ Jest extension not working?

1. **Check Jest command:** Press `Ctrl+Shift+P` → "Jest: Start Runner"
2. **Verify Jest installation:** Run `npx jest --version` in terminal
3. **Check configuration:** Make sure `jest.config.json` exists

### ❌ API tests failing?

1. **Start your backend:** Run `npm run backend` in another terminal
2. **Check API URL:** Verify `EXPO_PUBLIC_API_URL` environment variable
3. **Test manually:** Try accessing `http://localhost:3000/api/health` in browser

### ❌ Node fetch errors?

Make sure you installed node-fetch:
```bash
npm install --save-dev node-fetch@2.7.0
```

## 🎯 Using the Testing Interface

### Test Status Icons:
- ✅ **Green checkmark:** Test passed
- ❌ **Red X:** Test failed  
- ⏸️ **Yellow pause:** Test skipped
- 🔄 **Blue circle:** Test running
- ⚪ **Gray circle:** Test not run yet

### Test Actions:
- **Run/Debug buttons:** Appear when hovering over tests
- **Go to Test:** Click test name to jump to code
- **View Output:** Click failed tests to see error details
- **Filter:** Use search box to filter tests

### Keyboard Shortcuts:
- `Ctrl+Shift+T`: Open Testing panel
- `F5`: Debug current test
- `Ctrl+F5`: Run current test without debugging

## 📊 Expected Results

When your backend is running, you should see:
- ✅ **API Connectivity tests:** Pass if backend is running
- ✅ **Authentication tests:** Pass (validates endpoint structure)
- ✅ **Data Endpoint tests:** Pass or show 401 (auth required)
- ✅ **Performance tests:** Pass if response < 5 seconds
- ✅ **Error Handling tests:** Pass (validates error responses)
- ⚠️ **Google Auth tests:** May pass/fail depending on OAuth setup

## 🔄 Continuous Integration

The tests are also ready for CI/CD:
```yaml
# .github/workflows/test.yml
- name: Run API Tests
  run: npm test
```

Happy testing! 🚀
