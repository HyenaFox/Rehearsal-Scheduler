# Cleanup Guide: Removing Placeholder/Example Data

This guide helps you completely remove all placeholder and example data from the Rehearsal Scheduler app.

## What Was Cleaned Up

### ✅ Backend Database
- **Removed example users**: Eleanor Vance, Leo Maxwell, Clara Beaumont, Julian Adler, Aurora Chen
- **Removed test accounts**: test@example.com, webtest@example.com, testuser@example.com
- Script: `backend/cleanup-example-data.js`

### ✅ Frontend Code
- **Removed DEFAULT_ACTORS** from `app/types/index.js`
- **Updated AppContext** to start with empty actors list instead of loading defaults
- **Location**: `app/contexts/AppContext.tsx`

## Manual Steps to Complete Cleanup

### 1. Clear Browser Storage (Web App)
If using the web version, clear browser storage:
```javascript
// In browser console (F12)
localStorage.clear();
sessionStorage.clear();
```

### 2. Clear Mobile App Storage
For React Native mobile app:
```javascript
// Add this to any screen temporarily and run once
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    console.log('All AsyncStorage data cleared');
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};
```

### 3. Reset Timeslots (Optional)
The app still has default timeslots defined in `app/types/index.js`:
- Monday 2PM-4PM
- Tuesday 3PM-5PM  
- Wednesday 10AM-1PM
- Thursday 6PM-8PM
- Friday 11AM-2PM

**To customize these:**
1. Edit `DEFAULT_TIMESLOTS` in `app/types/index.js`
2. Or use the "Manage Timeslots" feature in the app

### 4. Reset Scenes (Optional)
Default scenes are defined in `app/types/index.js`:
- Act I, Scene 1
- Act I, Scene 2
- Act II, Scene 1
- Act II, Scene 3
- Act III, Scene 4

**To customize these:**
1. Edit `DEFAULT_SCENES` in `app/types/index.js`
2. Or add scene management features to the app

## Verification

After cleanup, you should have:
- ✅ Empty actors list in the app
- ✅ No placeholder users in database
- ✅ Clean starting point for real production data

## Next Steps

1. **Register real users** through the app
2. **Set up Google Calendar integration** for automatic timeslot management
3. **Create actual actors** by having users register and mark themselves as actors
4. **Import real availability** from Google Calendar or manual entry

## Database Status

Run this to check current database state:
```bash
cd backend
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await User.find().select('name email isActor createdAt');
  console.log('Current users in database:', users.length);
  users.forEach(user => console.log(\`- \${user.name} (\${user.email}) - Actor: \${user.isActor}\`));
  process.exit(0);
});
"
```

All placeholder data has been successfully removed! 🎉
