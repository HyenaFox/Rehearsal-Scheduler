require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'sethhaypol@gmail.com' });
    
    if (user) {
      console.log('User found:');
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Availability count:', user.availability ? user.availability.length : 0);
      console.log('- First 10 availability slots:', user.availability ? user.availability.slice(0, 10) : []);
      console.log('- Sample availability format:', user.availability && user.availability[0] ? typeof user.availability[0] + ': ' + user.availability[0] : 'N/A');
    } else {
      console.log('User not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUser();
