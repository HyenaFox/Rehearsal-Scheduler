require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function clearUserAvailability() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'sethhaypol@gmail.com' });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    console.log('Before clear - availability count:', user.availability?.length || 0);
    
    await User.updateOne(
      { email: 'sethhaypol@gmail.com' },
      { $set: { availability: [] } }
    );
    
    const updatedUser = await User.findOne({ email: 'sethhaypol@gmail.com' });
    console.log('After clear - availability count:', updatedUser.availability?.length || 0);
    console.log('✅ Successfully cleared availability for sethhaypol@gmail.com');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearUserAvailability();
