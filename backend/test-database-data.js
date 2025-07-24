require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const WeeklyAvailability = require('./src/models/WeeklyAvailability');

async function testDatabaseData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check WeeklyAvailability records
    const weeklySlots = await WeeklyAvailability.find({}).sort({ dayOfWeek: 1, startTime: 1 });
    console.log(`\n📊 WeeklyAvailability records: ${weeklySlots.length}`);
    
    // Show first few records
    console.log('\n📋 First 5 WeeklyAvailability records:');
    weeklySlots.slice(0, 5).forEach((slot, index) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`${index + 1}. ${days[slot.dayOfWeek]} ${slot.startTime} - ${slot.endTime}`);
    });
    
    // Check if we have any users
    const users = await User.find({});
    console.log(`\n👥 Users in database: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n📋 First user:');
      console.log(`ID: ${users[0]._id}`);
      console.log(`Name: ${users[0].name}`);
      console.log(`Email: ${users[0].email}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDatabaseData();
