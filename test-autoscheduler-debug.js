// Test autoscheduler locally with debug output
const { findBestRehearsalOpportunities } = require('./app/utils/autoScheduler');

// Mock data from the backend logs
const scenes = [
  {
    "_id": "6865b2c5b678767a2b5d0ddd",
    "title": "Joe Bones",
    "actors": [
      "68634c3e2a5a87ca68632000", // Lyn Stanley
      "685d84241952838095362ed5"  // Seth Haycock-Poller
    ]
  }
];

const actors = [
  {
    "_id": "68634c3e2a5a87ca68632000",
    "name": "Lyn Stanley",
    "availability": [], // Empty - uses timeslots instead
    "availableTimeslots": [
      "68633a142ed00b29f1a5c289",
      "68633a142ed00b29f1a5c28a"
    ],
    "scenes": [
      "6865b2c5b678767a2b5d0ddd" // Joe Bones scene ID
    ]
  },
  {
    "_id": "685d84241952838095362ed5",
    "name": "Seth Haycock-Poller",
    "availability": [
      "2025-07-30T13:00:00.000Z",  // 9:00 AM EST (July 30, Wednesday)
      "2025-07-30T14:30:00.000Z",  // 10:30 AM EST 
      "2025-07-30T15:00:00.000Z",  // 11:00 AM EST
      "2025-07-30T16:30:00.000Z",  // 12:30 PM EST
      "2025-07-30T17:00:00.000Z",  // 1:00 PM EST
      "2025-07-30T18:30:00.000Z"   // 2:30 PM EST
    ],
    "scenes": [
      "6865b2c5b678767a2b5d0ddd" // Joe Bones scene ID
    ]
  }
];

const timeslots = [];

console.log('🔍 Testing autoscheduler with mock data...');
console.log('📊 Scenes:', scenes.map(s => ({ id: s._id, title: s.title, actors: s.actors })));
console.log('🎭 Actors:', actors.map(a => ({ 
  id: a._id, 
  name: a.name, 
  availabilityCount: a.availability.length,
  timeslotCount: a.availableTimeslots ? a.availableTimeslots.length : 0
})));

const opportunities = findBestRehearsalOpportunities(actors, 'Wednesday', [], timeslots, scenes);

console.log('\n🎯 Results:', opportunities);
