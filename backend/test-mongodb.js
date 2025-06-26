// Test MongoDB connection and basic functionality
require('dotenv').config();

const { initDB, mongoDB } = require('./src/models/database.mongodb');
const User = require('./src/models/User.mongodb');

async function testMongoDB() {
  try {
    console.log('🧪 Testing MongoDB Setup...\n');

    // Test 1: Database Connection
    console.log('1. Testing database connection...');
    await initDB();
    console.log('✅ Database connection successful\n');

    // Test 2: User Creation
    console.log('2. Testing user creation...');
    const testUser = await User.createUser({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '555-1234',
      isActor: false
    });
    console.log('✅ User created:', testUser.email);
    console.log('📋 User ID:', testUser._id);
    console.log('🔒 Password hashed:', testUser.password_hash.startsWith('$2b$'));
    console.log('');

    // Test 3: User Authentication
    console.log('3. Testing password authentication...');
    const isValidPassword = await testUser.comparePassword('password123');
    const isInvalidPassword = await testUser.comparePassword('wrongpassword');
    console.log('✅ Correct password:', isValidPassword);
    console.log('❌ Wrong password:', isInvalidPassword);
    console.log('');

    // Test 4: User Lookup
    console.log('4. Testing user lookup...');
    const foundUser = await User.findByEmail('test@example.com');
    console.log('✅ User found by email:', foundUser ? foundUser.name : 'Not found');
    console.log('');

    // Test 5: User Update
    console.log('5. Testing user update...');
    const updatedUser = await User.updateUser(testUser._id, {
      isActor: true,
      availableTimeslots: ['morning', 'afternoon'],
      scenes: ['scene1', 'scene2']
    });
    console.log('✅ User updated:', updatedUser.name);
    console.log('🎭 Is actor:', updatedUser.isActor);
    console.log('⏰ Timeslots:', updatedUser.availableTimeslots);
    console.log('🎬 Scenes:', updatedUser.scenes);
    console.log('');

    // Test 6: JSON Serialization (password should be hidden)
    console.log('6. Testing JSON serialization...');
    const userJSON = testUser.toJSON();
    console.log('✅ Password hidden:', !('password_hash' in userJSON));
    console.log('📄 User JSON keys:', Object.keys(userJSON));
    console.log('');

    // Clean up
    console.log('7. Cleaning up test data...');
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test user deleted\n');

    // Disconnect
    await mongoDB.disconnect();
    
    console.log('🎉 All MongoDB tests passed!');
    console.log('✅ Ready to use MongoDB with your Rehearsal Scheduler app');

  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
    
    if (error.message.includes('MONGODB_URI')) {
      console.log('\n💡 Quick Fix:');
      console.log('1. Create .env file in backend folder');
      console.log('2. Add: MONGODB_URI=mongodb://localhost:27017/rehearsal-scheduler');
      console.log('3. Or use MongoDB Atlas connection string');
    }
    
    process.exit(1);
  }
}

// Run tests
testMongoDB();
