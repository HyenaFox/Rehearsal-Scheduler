# Firebase Setup Guide

## 1. Install Firebase

```bash
npm install firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
```

## 2. Firebase Configuration

Create `app/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 3. Data Structure in Firestore

```
users/
  {userId}/
    profile: { displayName, contactInfo, notes, createdAt }
    availability: { timeslotId: true/false }
    scenes: { sceneId: true/false }

projects/
  {projectId}/
    info: { name, description, createdBy, createdAt }
    timeslots: { id, label, day, startTime, endTime }
    scenes: { id, title, description }
    rehearsals: { id, sceneId, timeslotId, actors[], createdAt }
    
cast/
  {projectId}/
    members/
      {userId}: { role, joinedAt, status }
```

## 4. Benefits

- Real-time updates across all devices
- Built-in authentication
- Offline support with automatic sync
- Security rules for data protection
- Automatic scaling
- Free tier available
