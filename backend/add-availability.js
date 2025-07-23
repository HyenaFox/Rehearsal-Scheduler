const mongoose = require('mongoose');
const WeeklyAvailability = require('./src/models/WeeklyAvailability');

require('dotenv').config();

async function addAvailabilityData() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check existing availability
    const existing = await WeeklyAvailability.find();
    console.log('📋 Current availability records:', existing.length);
    
    if (existing.length === 0) {
      console.log('📝 Adding sample availability periods...');
      
      const availabilityData = [
        { dayOfWeek: 1, startTime: '18:00', endTime: '22:00' }, // Monday 6-10 PM
        { dayOfWeek: 2, startTime: '19:00', endTime: '21:00' }, // Tuesday 7-9 PM
        { dayOfWeek: 3, startTime: '18:00', endTime: '22:00' }, // Wednesday 6-10 PM
        { dayOfWeek: 4, startTime: '19:30', endTime: '21:30' }, // Thursday 7:30-9:30 PM
        { dayOfWeek: 5, startTime: '19:00', endTime: '23:00' }, // Friday 7-11 PM
        { dayOfWeek: 6, startTime: '14:00', endTime: '18:00' }, // Saturday 2-6 PM
        { dayOfWeek: 0, startTime: '15:00', endTime: '19:00' }  // Sunday 3-7 PM
      ];
      
      for (const avail of availabilityData) {
        await WeeklyAvailability.create(avail);
      }
      
      console.log('✅ Added sample availability periods');
    } else {
      console.log('ℹ️ Availability data already exists');
    }
    
    // Show all availability
    const all = await WeeklyAvailability.find().sort({ dayOfWeek: 1, startTime: 1 });
    console.log('📅 All availability periods:');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    all.forEach(avail => {
      console.log(`  ${days[avail.dayOfWeek]}: ${avail.startTime} - ${avail.endTime}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addAvailabilityData();
