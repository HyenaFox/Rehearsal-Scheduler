// Test script to identify which route is causing the issue
console.log('Testing route imports...');

try {
  console.log('Testing auth routes...');
  const authRoutes = require('./src/routes/auth');
  console.log('Auth routes type:', typeof authRoutes);
  console.log('Auth routes constructor:', authRoutes.constructor.name);
  console.log('Auth routes keys:', Object.keys(authRoutes));
} catch (error) {
  console.error('Error with auth routes:', error.message);
}

try {
  console.log('Testing calendar routes...');
  const calendarRoutes = require('./src/routes/calendar');
  console.log('Calendar routes type:', typeof calendarRoutes);
  console.log('Calendar routes constructor:', calendarRoutes.constructor.name);
  console.log('Calendar routes keys:', Object.keys(calendarRoutes));
} catch (error) {
  console.error('Error with calendar routes:', error.message);
}

try {
  console.log('Testing actors routes...');
  const actorsRoutes = require('./src/routes/actors');
  console.log('Actors routes type:', typeof actorsRoutes);
  console.log('Actors routes constructor:', actorsRoutes.constructor.name);
  console.log('Actors routes keys:', Object.keys(actorsRoutes));
} catch (error) {
  console.error('Error with actors routes:', error.message);
}

try {
  console.log('Testing timeslots routes...');
  const timeslotsRoutes = require('./src/routes/timeslots');
  console.log('Timeslots routes type:', typeof timeslotsRoutes);
  console.log('Timeslots routes constructor:', timeslotsRoutes.constructor.name);
  console.log('Timeslots routes keys:', Object.keys(timeslotsRoutes));
} catch (error) {
  console.error('Error with timeslots routes:', error.message);
}

try {
  console.log('Testing scenes routes...');
  const scenesRoutes = require('./src/routes/scenes');
  console.log('Scenes routes type:', typeof scenesRoutes);
  console.log('Scenes routes constructor:', scenesRoutes.constructor.name);
  console.log('Scenes routes keys:', Object.keys(scenesRoutes));
} catch (error) {
  console.error('Error with scenes routes:', error.message);
}

console.log('Route testing completed.');
