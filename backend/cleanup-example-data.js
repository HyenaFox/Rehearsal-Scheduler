// Script to delete example/placeholder actors and timeslots from database
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./src/models/User');

// List of example/placeholder emails and names to remove
const EXAMPLE_DATA = {
  emails: [
    'test@example.com',
    'webtest@example.com',
    'webuser@example.com',
    'eleanor@example.com',
    'leo@example.com', 
    'clara@example.com',
    'julian@example.com',
    'aurora@example.com',
    'testuser@example.com'
  ],
  names: [
    'Eleanor Vance',
    'Leo Maxwell',
    'Clara Beaumont', 
    'Julian Adler',
    'Aurora Chen',
    'Test User',
    'Web Test User',
    'Web User'
  ]
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function cleanupExampleData() {
  try {
    console.log('🧹 Starting cleanup of example/placeholder data...\n');

    // Find users with example emails
    const usersByEmail = await User.find({ 
      email: { $in: EXAMPLE_DATA.emails } 
    });

    // Find users with example names  
    const usersByName = await User.find({ 
      name: { $in: EXAMPLE_DATA.names } 
    });

    // Combine and deduplicate
    const allExampleUsers = [...usersByEmail, ...usersByName];
    const uniqueUsers = allExampleUsers.filter((user, index, self) => 
      self.findIndex(u => u._id.toString() === user._id.toString()) === index
    );

    if (uniqueUsers.length === 0) {
      console.log('✅ No example users found in database');
      return;
    }

    console.log(`📋 Found ${uniqueUsers.length} example users to delete:`);
    uniqueUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - Actor: ${user.isActor ? 'Yes' : 'No'}`);
    });

    // Ask for confirmation
    console.log('\n⚠️  This will permanently delete these users from the database!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete the users
    const userIds = uniqueUsers.map(user => user._id);
    const deleteResult = await User.deleteMany({ _id: { $in: userIds } });

    console.log(`✅ Deleted ${deleteResult.deletedCount} example users from database`);

    // Show remaining users
    const remainingUsers = await User.find().select('name email isActor createdAt');
    
    if (remainingUsers.length > 0) {
      console.log(`\n📋 Remaining users in database (${remainingUsers.length}):`);
      remainingUsers.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - Actor: ${user.isActor ? 'Yes' : 'No'} - Created: ${user.createdAt.toLocaleDateString()}`);
      });
    } else {
      console.log('\n✅ Database is now clean - no users remaining');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function main() {
  await connectDB();
  await cleanupExampleData();
  
  console.log('\n🎉 Cleanup complete!');
  console.log('\n📝 Note: You may also want to:');
  console.log('   1. Clear browser localStorage/AsyncStorage');
  console.log('   2. Remove DEFAULT_ACTORS from app/types/index.js');
  console.log('   3. Update AppContext to not load default actors');
  
  process.exit(0);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n❌ Cleanup cancelled by user');
  process.exit(0);
});

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
