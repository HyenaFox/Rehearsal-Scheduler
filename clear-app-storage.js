// Clear all app data from browser storage
// Run this in the browser console to reset everything

console.log('🧹 Clearing all app storage data...');

// Clear localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('rehearsal') || key.includes('actor') || key.includes('timeslot')) {
    console.log('Removing localStorage key:', key);
    localStorage.removeItem(key);
  }
});

// Clear sessionStorage
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('rehearsal') || key.includes('actor') || key.includes('timeslot')) {
    console.log('Removing sessionStorage key:', key);
    sessionStorage.removeItem(key);
  }
});

// Clear IndexedDB (React Native AsyncStorage in web)
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name && (db.name.includes('rehearsal') || db.name.includes('async'))) {
        console.log('Removing IndexedDB:', db.name);
        indexedDB.deleteDatabase(db.name);
      }
    });
  });
}

// Clear any app-specific keys
const appKeys = [
  '@rehearsal_scheduler_actors',
  '@rehearsal_scheduler_rehearsals', 
  '@rehearsal_scheduler_timeslots',
  '@rehearsal_scheduler_scenes',
  '@rehearsal_scheduler_user',
  '@rehearsal_scheduler_users_db'
];

appKeys.forEach(key => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
  console.log('Cleared app key:', key);
});

console.log('✅ App storage cleared! Refresh the page to start fresh.');
console.log('🔄 If you still see old data, try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
