require('dotenv').config();
const mongoose = require('mongoose');
const WeeklyAvailability = require('./src/models/WeeklyAvailability');

async function fixWeeklyAvailabilityData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check current data
    const all = await WeeklyAvailability.find({});
    console.log('📊 Found', all.length, 'records');
    
    // Check for corrupted data (missing required fields)
    const corrupted = await WeeklyAvailability.find({ 
      $or: [
        { dayOfWeek: { $exists: false } }, 
        { startTime: { $exists: false } }, 
        { endTime: { $exists: false } },
        { dayOfWeek: null },
        { startTime: null },
        { endTime: null }
      ] 
    });
    
    console.log('🔍 Found', corrupted.length, 'corrupted records');
    
    if (corrupted.length > 0) {
      console.log('🗑️ Deleting corrupted records...');
      await WeeklyAvailability.deleteMany({ 
        $or: [
          { dayOfWeek: { $exists: false } }, 
          { startTime: { $exists: false } }, 
          { endTime: { $exists: false } },
          { dayOfWeek: null },
          { startTime: null },
          { endTime: null }
        ] 
      });
      console.log('✅ Corrupted records deleted');
    }
    
    // Check if we have any valid data left
    const remaining = await WeeklyAvailability.find({});
    console.log('📊 Records remaining after cleanup:', remaining.length);
    
    // Add default weekly availability if none exists
    if (remaining.length === 0) {
      console.log('📅 Adding default weekly availability...');
      const defaultSlots = [
        { dayOfWeek: 1, startTime: '18:00', endTime: '22:00' }, // Monday 6-10 PM
        { dayOfWeek: 2, startTime: '18:00', endTime: '22:00' }, // Tuesday 6-10 PM  
        { dayOfWeek: 3, startTime: '18:00', endTime: '22:00' }, // Wednesday 6-10 PM
        { dayOfWeek: 4, startTime: '18:00', endTime: '22:00' }, // Thursday 6-10 PM
        { dayOfWeek: 5, startTime: '18:00', endTime: '22:00' }, // Friday 6-10 PM
        { dayOfWeek: 6, startTime: '10:00', endTime: '18:00' }, // Saturday 10-6 PM
        { dayOfWeek: 0, startTime: '12:00', endTime: '17:00' }  // Sunday 12-5 PM
      ];
      
      await WeeklyAvailability.insertMany(defaultSlots);
      console.log('✅ Default weekly availability added');
    }
    
    // Show final state
    const final = await WeeklyAvailability.find({}).sort({ dayOfWeek: 1, startTime: 1 });
    console.log('📊 Final count:', final.length);
    final.forEach((slot, i) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`  ${i+1}. ${days[slot.dayOfWeek]} ${slot.startTime} - ${slot.endTime}`);
    });
    
    await mongoose.disconnect();
    console.log('✅ Database cleanup completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWeeklyAvailabilityData();
