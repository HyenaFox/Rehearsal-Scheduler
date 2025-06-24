# Migration to Server Storage - Step by Step Guide

## Current App vs Server-Based App

### Current Limitations with AsyncStorage:
- Data is lost when app is uninstalled
- No multi-device sync
- No real-time collaboration
- Limited by device storage
- No backup/recovery options

### Benefits of Server Storage:
- ✅ Data persists across devices
- ✅ Real-time updates for all users
- ✅ Automatic backups
- ✅ Better scalability
- ✅ Enhanced security
- ✅ Offline sync capabilities

## Recommended Implementation: Firebase

### Step 1: Install Firebase
```bash
npm install firebase
expo install expo-dev-client
```

### Step 2: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Create new project
3. Enable Firestore Database
4. Enable Authentication
5. Get your config keys

### Step 3: Update Your App Structure

#### Before (AsyncStorage):
```
- Data stored locally on device
- Manual user management
- No real-time updates
- Limited collaboration
```

#### After (Firebase):
```
- Data stored in cloud
- Firebase Authentication
- Real-time listeners
- Multi-user collaboration
```

### Step 4: Key Changes Needed

#### 1. Authentication Context Update
Replace username-based auth with Firebase Auth:

```javascript
// Old: Username/password stored locally
const login = async (username) => {
  const users = await StorageService.loadUsers();
  // ... local logic
}

// New: Email/password with Firebase
const login = async (email, password) => {
  const result = await FirebaseStorageService.signIn(email, password);
  // ... Firebase auth
}
```

#### 2. Data Structure Changes
```javascript
// Old: Flat arrays in AsyncStorage
actors: [{ id, name, availableTimeslots, scenes }]

// New: Relational structure in Firestore
users/{userId}/profile: { displayName, contactInfo }
users/{userId}/availability/{timeslotId}: { available: true/false }
users/{userId}/scenes/{sceneId}: { participating: true/false }
```

#### 3. Real-time Updates
```javascript
// Old: Manual state updates
const addRehearsal = (rehearsal) => {
  setRehearsals([...rehearsals, rehearsal]);
  StorageService.saveRehearsals(updatedRehearsals);
}

// New: Real-time listeners
useEffect(() => {
  const unsubscribe = FirebaseStorageService.subscribeToRehearsals(
    projectId, 
    (updatedRehearsals) => {
      setRehearsals(updatedRehearsals);
    }
  );
  return unsubscribe;
}, [projectId]);
```

## Migration Strategy

### Phase 1: Setup Firebase (1-2 days)
- Create Firebase project
- Install dependencies
- Configure authentication

### Phase 2: Migrate Authentication (2-3 days)
- Replace AuthContext with Firebase Auth
- Update login/signup screens
- Test authentication flow

### Phase 3: Migrate Data Storage (3-5 days)
- Replace AsyncStorage calls with Firestore
- Update data models
- Implement real-time listeners

### Phase 4: Add Project Support (2-3 days)
- Enable multiple projects per user
- Add project creation/joining
- Update UI for project selection

### Phase 5: Testing & Polish (2-3 days)
- Test offline/online sync
- Handle error cases
- Optimize performance

## Alternative: Quick Win with Supabase

If you want something simpler than Firebase:

```bash
npm install @supabase/supabase-js
```

Supabase provides:
- PostgreSQL database
- Real-time subscriptions
- Built-in authentication
- Row Level Security
- Easier data relationships

## Would you like me to implement Firebase for your app?

I can help you:
1. Set up Firebase configuration
2. Migrate your authentication system
3. Convert your data storage to Firestore
4. Add real-time features
5. Implement offline support

The migration would take about 1-2 weeks but would give you a much more robust and scalable app.

## Cost Considerations

### Firebase Free Tier:
- 50k reads/day
- 20k writes/day
- 1GB storage
- Free authentication

This should be enough for a small-medium rehearsal app.

### Paid Tier:
- Starts at $25/month for larger usage
- Scales automatically
- Enterprise features available
