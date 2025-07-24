const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rehearsal-scheduler')
  .then(() => console.log('🔐 🔍 DEBUGGING: Connected to MongoDB'))
  .catch(err => console.error('🔐 🔍 DEBUGGING: MongoDB connection error:', err));

// Import User model (assuming it's in src/models/User.js)
const User = require('./src/models/User');

async function debugGoogleAuth() {
  try {
    console.log('🔐 🔍 DEBUGGING: Checking existing users...');
    
    // Find all users
    const allUsers = await User.find({}).select('email name isActor isAdmin googleId createdAt');
    console.log('🔐 🔍 DEBUGGING: Total users in database:', allUsers.length);
    
    if (allUsers.length > 0) {
      console.log('🔐 🔍 DEBUGGING: Users found:');
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} - ${user.name} (Actor: ${user.isActor}, Admin: ${user.isAdmin}, GoogleID: ${user.googleId ? 'Yes' : 'No'})`);
      });
    }
    
    // Check specifically for sethhaypol@gmail.com
    console.log('\n🔐 🔍 DEBUGGING: Checking for sethhaypol@gmail.com...');
    const sethUser = await User.findByEmail('sethhaypol@gmail.com');
    
    if (sethUser) {
      console.log('🔐 🔍 DEBUGGING: ✅ Found sethhaypol@gmail.com user:', {
        id: sethUser._id,
        email: sethUser.email,
        name: sethUser.name,
        isActor: sethUser.isActor,
        isAdmin: sethUser.isAdmin,
        hasGoogleId: !!sethUser.googleId,
        googleId: sethUser.googleId,
        createdAt: sethUser.createdAt
      });
      
      console.log('\n🔐 🔍 DEBUGGING: This user should be able to login with Google using the same email');
    } else {
      console.log('🔐 🔍 DEBUGGING: ❌ No user found with email sethhaypol@gmail.com');
      console.log('🔐 🔍 DEBUGGING: When logging in with Google, a new user will be created');
    }
    
    // Test email normalization
    console.log('\n🔐 🔍 DEBUGGING: Testing email normalization...');
    const testEmails = [
      'sethhaypol@gmail.com',
      'SETHHAYPOL@GMAIL.COM',
      ' sethhaypol@gmail.com ',
      'SethHaypol@Gmail.Com'
    ];
    
    for (const testEmail of testEmails) {
      const normalized = testEmail.toLowerCase().trim();
      console.log(`  "${testEmail}" -> "${normalized}"`);
      const found = await User.findByEmail(testEmail);
      console.log(`    Found user: ${found ? '✅ Yes' : '❌ No'}`);
    }
    
  } catch (error) {
    console.error('🔐 🔍 DEBUGGING: Error during debugging:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔐 🔍 DEBUGGING: Database connection closed');
  }
}

debugGoogleAuth();
