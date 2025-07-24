const mongoose = require('mongoose');
const User = require('./src/models/User');

require('dotenv').config();

async function addValidUserAvailability() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'sethhaypol@gmail.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    // Add availability slots for valid rehearsal days (Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4)
    const today = new Date();
    const sampleAvailability = [];
    
    // Find next valid rehearsal days and add slots
    const validDays = [0, 1, 2, 3, 4]; // Sunday, Monday, Tuesday, Wednesday, Thursday
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      
      if (validDays.includes(checkDate.getDay())) {
        // Add 6:00 PM slot
        const slot1 = new Date(checkDate);
        slot1.setHours(18, 0, 0, 0);
        sampleAvailability.push(slot1.toISOString());
        
        // Add 8:30 PM slot
        const slot2 = new Date(checkDate);
        slot2.setHours(20, 30, 0, 0);
        sampleAvailability.push(slot2.toISOString());
        
        console.log(`📅 Added slots for ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][checkDate.getDay()]}: 6:00 PM, 8:30 PM`);
      }
    }
    
    console.log('📅 Adding valid availability slots:', sampleAvailability.length);
    
    user.availability = sampleAvailability;
    await user.save();
    
    console.log('✅ Successfully added valid availability to user');
    console.log('📊 Total slots:', user.availability.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addValidUserAvailability();
