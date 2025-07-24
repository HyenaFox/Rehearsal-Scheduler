// Quick timezone test
const testSlot = '2025-07-24T02:00:00.000Z';
const date = new Date(testSlot);

console.log('Original ISO string:', testSlot);
console.log('Date object:', date);
console.log('Local day (getDay()):', date.getDay(), '- Should be 3 for Wednesday');
console.log('Local hour (getHours()):', date.getHours(), '- Should be 22 for 10 PM');
console.log('Local minute (getMinutes()):', date.getMinutes(), '- Should be 0');
console.log('UTC day (getUTCDay()):', date.getUTCDay());
console.log('UTC hour (getUTCHours()):', date.getUTCHours());
console.log('UTC minute (getUTCMinutes()):', date.getUTCMinutes());
console.log('Timezone offset:', date.getTimezoneOffset(), 'minutes');

// Test the expected Wednesday 10 PM slot
const today = new Date();
const wednesday = new Date(today);
wednesday.setDate(today.getDate() + ((3 - today.getDay() + 7) % 7));
wednesday.setHours(22, 0, 0, 0);
console.log('\nExpected Wednesday 10 PM ISO:', wednesday.toISOString());
console.log('Does it match stored?', wednesday.toISOString() === testSlot);
