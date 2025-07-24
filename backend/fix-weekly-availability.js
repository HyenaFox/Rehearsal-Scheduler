require('dotenv').config();
const mongoose = require('mongoose');
const WeeklyAvailability = require('./src/models/WeeklyAvailability');

async function fixWeeklyAvailability() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing broken records
    await WeeklyAvailability.deleteMany({});
    console.log('Cleared existing WeeklyAvailability records');
    
    // Create proper timeslots (11 timeslots per day, 5 days a week)
    const timeslots = [];
    
    // Days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday  
    const rehearsalDays = [0, 1, 2, 3, 4];
    
    // Times: 6:00 PM to 11:30 PM in 30-minute intervals
    const times = [
      { startTime: "18:00", endTime: "18:30" },   // 6:00 PM - 6:30 PM
      { startTime: "18:30", endTime: "19:00" },   // 6:30 PM - 7:00 PM
      { startTime: "19:00", endTime: "19:30" },   // 7:00 PM - 7:30 PM
      { startTime: "19:30", endTime: "20:00" },   // 7:30 PM - 8:00 PM
      { startTime: "20:00", endTime: "20:30" },   // 8:00 PM - 8:30 PM
      { startTime: "20:30", endTime: "21:00" },   // 8:30 PM - 9:00 PM
      { startTime: "21:00", endTime: "21:30" },   // 9:00 PM - 9:30 PM
      { startTime: "21:30", endTime: "22:00" },   // 9:30 PM - 10:00 PM
      { startTime: "22:00", endTime: "22:30" },   // 10:00 PM - 10:30 PM
      { startTime: "22:30", endTime: "23:00" },   // 10:30 PM - 11:00 PM
      { startTime: "23:00", endTime: "23:30" }    // 11:00 PM - 11:30 PM
    ];
    
    for (const day of rehearsalDays) {
      for (const time of times) {
        timeslots.push({
          dayOfWeek: day,
          startTime: time.startTime,
          endTime: time.endTime
        });
      }
    }
    
    console.log(`Creating ${timeslots.length} timeslots (${times.length} times × ${rehearsalDays.length} days)`);
    
    const result = await WeeklyAvailability.insertMany(timeslots);
    console.log(`✅ Successfully created ${result.length} WeeklyAvailability records`);
    
    // Verify the data
    const verification = await WeeklyAvailability.find({}).sort({ dayOfWeek: 1, startTime: 1 });
    console.log('\n📋 Verification - First 5 timeslots:');
    verification.slice(0, 5).forEach((slot, index) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`${index + 1}. ${days[slot.dayOfWeek]} ${slot.startTime} - ${slot.endTime}`);
    });
    
    console.log(`\n✅ Total timeslots in database: ${verification.length}`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixWeeklyAvailability();
