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

// Default data
export const DEFAULT_TIMESLOTS = [
  { id: 'mon-2pm-4pm', label: 'Mon, 2:00 PM - 4:00 PM', day: 'Monday', startTime: '2:00 PM', endTime: '4:00 PM' },
  { id: 'tue-3pm-5pm', label: 'Tue, 3:00 PM - 5:00 PM', day: 'Tuesday', startTime: '3:00 PM', endTime: '5:00 PM' },
  { id: 'wed-10am-1pm', label: 'Wed, 10:00 AM - 1:00 PM', day: 'Wednesday', startTime: '10:00 AM', endTime: '1:00 PM' },
  { id: 'thu-6pm-8pm', label: 'Thu, 6:00 PM - 8:00 PM', day: 'Thursday', startTime: '6:00 PM', endTime: '8:00 PM' },
  { id: 'fri-11am-2pm', label: 'Fri, 11:00 AM - 2:00 PM', day: 'Friday', startTime: '11:00 AM', endTime: '2:00 PM' },
];

export const DEFAULT_SCENES = [
  { id: 'act1-scene1', title: 'Act I, Scene 1', description: 'Opening scene' },
  { id: 'act1-scene2', title: 'Act I, Scene 2', description: 'Character introductions' },
  { id: 'act2-scene1', title: 'Act II, Scene 1', description: 'Conflict begins' },
  { id: 'act2-scene3', title: 'Act II, Scene 3', description: 'Climax' },
  { id: 'act3-scene4', title: 'Act III, Scene 4', description: 'Resolution' },
];

// Global mutable arrays that all components can reference
export const GLOBAL_TIMESLOTS = [...DEFAULT_TIMESLOTS];
export const GLOBAL_SCENES = [...DEFAULT_SCENES];

export const DEFAULT_ACTORS = [
  {
    id: '1',
    name: 'Eleanor Vance',
    availableTimeslots: ['mon-2pm-4pm', 'wed-10am-1pm'],
    scenes: ['Act I, Scene 2', 'Act II, Scene 1'],
  },
  {
    id: '2',
    name: 'Leo Maxwell',
    availableTimeslots: ['tue-3pm-5pm', 'fri-11am-2pm'],
    scenes: ['Act I, Scene 1', 'Act II, Scene 3'],
  },
  {
    id: '3',
    name: 'Clara Beaumont',
    availableTimeslots: ['mon-2pm-4pm', 'thu-6pm-8pm'],
    scenes: ['Act I, Scene 2', 'Act III, Scene 4'],
  },
  {
    id: '4',
    name: 'Julian Adler',
    availableTimeslots: ['wed-10am-1pm', 'fri-11am-2pm'],
    scenes: ['Act II, Scene 1', 'Act II, Scene 3'],
  },
  {
    id: '5',
    name: 'Aurora Chen',
    availableTimeslots: ['tue-3pm-5pm', 'thu-6pm-8pm'],
    scenes: ['Act I, Scene 1', 'Act III, Scene 4'],
  },
];
