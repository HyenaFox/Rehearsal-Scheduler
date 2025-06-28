const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('./src/models/User');

async function createTestUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://tate:pass@cluster0.ma5xhcl.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    console.log('🔍 Checking if test user exists...');
    let testUser = await User.findOne({ email: 'test@test.com' });

    if (!testUser) {
      // Create the test user using the model's createUser method
      console.log('👤 Creating test user...');
      
      testUser = await User.createUser({
        email: 'test@test.com',
        password: 'test123',
        name: 'Test User',
        phone: '555-0123',
        isActor: true
      });

      console.log('✅ Test user created successfully!');
    } else {
      console.log('ℹ️ Test user already exists - removing and recreating...');
      // Remove the existing user and create a new one with proper password
      await User.deleteOne({ email: 'test@test.com' });
      console.log('🗑️ Existing test user removed');
      
      testUser = await User.createUser({
        email: 'test@test.com',
        password: 'test123',
        name: 'Test User',
        phone: '555-0123',
        isActor: true
      });
      
      console.log('✅ Test user recreated successfully!');
    }

    // List all users for verification
    console.log('📋 All users in database:');
    const allUsers = await User.find({}, 'email name isActor isAdmin');
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Actor: ${user.isActor}, Admin: ${user.isAdmin}`);
    });

    console.log('🎉 Test user setup complete!');
    console.log('📧 Email: test@test.com');
    console.log('🔑 Password: test123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

createTestUser();
