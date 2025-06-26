require('dotenv').config();
const { MongoClient } = require('mongodb');

async function cleanupDatabase() {
  try {
    console.log('🔍 Connecting to database...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    console.log('📋 Checking current users...');
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`Found ${users.length} users in database:`);
    
    // List all users
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Actor: ${user.isActor}`);
    });
    
    console.log('\n🧹 Identifying test/example users to remove...');
    
    // Define patterns for test/example users to remove
    const testEmailPatterns = [
      /@example\.com$/,
      /^test/i,
      /^demo/i,
      /^example/i,
      /^actor\d+/i,
      /^john/i,
      /^jane/i,
      /^sarah/i,
      /^mike/i,
      /^emily/i
    ];
    
    const testNames = [
      'John Doe',
      'Jane Smith', 
      'Sarah Johnson',
      'Mike Brown',
      'Emily Davis',
      'Test User',
      'Demo User',
      'Example User'
    ];
    
    // Find users to remove
    const usersToRemove = users.filter(user => {
      // Check email patterns
      const emailMatch = testEmailPatterns.some(pattern => pattern.test(user.email));
      // Check name patterns
      const nameMatch = testNames.some(name => 
        user.name && user.name.toLowerCase().includes(name.toLowerCase())
      );
      
      return emailMatch || nameMatch;
    });
    
    console.log(`\n❌ Found ${usersToRemove.length} test/example users to remove:`);
    usersToRemove.forEach(user => {
      console.log(`   - ${user.email} (${user.name})`);
    });
    
    if (usersToRemove.length > 0) {
      console.log('\n🗑️ Removing test/example users...');
      const userIds = usersToRemove.map(user => user._id);
      const result = await db.collection('users').deleteMany({
        _id: { $in: userIds }
      });
      
      console.log(`✅ Removed ${result.deletedCount} test/example users`);
    } else {
      console.log('✅ No test/example users found to remove');
    }
    
    // Check final count
    const finalUsers = await db.collection('users').find({}).toArray();
    console.log(`\n📊 Final user count: ${finalUsers.length}`);
    
    console.log('\n👥 Remaining users:');
    finalUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name}) - Actor: ${user.isActor}`);
    });
    
    await client.close();
    console.log('\n✅ Database cleanup completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDatabase();
