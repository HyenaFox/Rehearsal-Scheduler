const mongoose = require('mongoose');
const User = require('./src/models/User');

require('dotenv').config();

async function addUserAvailability() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'sethhaypol@gmail.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    // Add some sample availability slots for the next 7 days
    const today = new Date();
    const sampleAvailability = [];
    
    // Add a few slots for testing
    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      
      // Add 6:00 PM slot
      const slot1 = new Date(targetDate);
      slot1.setHours(18, 0, 0, 0);
      sampleAvailability.push(slot1.toISOString());
      
      // Add 7:30 PM slot
      const slot2 = new Date(targetDate);
      slot2.setHours(19, 30, 0, 0);
      sampleAvailability.push(slot2.toISOString());
    }
    
    console.log('📅 Adding availability slots:', sampleAvailability.length);
    
    user.availability = sampleAvailability;
    await user.save();
    
    console.log('✅ Successfully added availability to user');
    console.log('📊 Total slots:', user.availability.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addUserAvailability();
