import { findBestRehearsalOpportunities } from './app/utils/autoScheduler.js';

// Test with Friday (not a rehearsal day)
console.log('Testing Friday (should be rejected):');
const fridayResults = findBestRehearsalOpportunities([], 'Friday', [], [], []);
console.log('Friday results:', fridayResults.length);

console.log('\nTesting Saturday (should be rejected):');
const saturdayResults = findBestRehearsalOpportunities([], 'Saturday', [], [], []);
console.log('Saturday results:', saturdayResults.length);

console.log('\nTesting Wednesday (should work):');
const wednesdayResults = findBestRehearsalOpportunities([], 'Wednesday', [], [], []);
console.log('Wednesday results: Found', wednesdayResults.length, 'timeslots');
