import { getGlobalTimeSlotsForDay } from './app/utils/globalTimeslots.js';

const slots = getGlobalTimeSlotsForDay(3); // Wednesday
console.log('Last few slots:');
slots.slice(-3).forEach(s => {
  console.log(`${s.label} (${s.id})`);
});
