// Type definitions and interfaces for the app

// Storage Keys
export const STORAGE_KEYS = {
  ACTORS: '@rehearsal_scheduler_actors',
  REHEARSALS: '@rehearsal_scheduler_rehearsals',
  TIMESLOTS: '@rehearsal_scheduler_timeslots',
  SCENES: '@rehearsal_scheduler_scenes',
  USER: '@rehearsal_scheduler_user',
  USERS_DB: '@rehearsal_scheduler_users_db',
};

// Note: All hardcoded default data has been removed to ensure a clean database-driven experience
// Actors, scenes, and timeslots are now managed exclusively through the database and API
// Directors/administrators create these through the admin interface or API endpoints
