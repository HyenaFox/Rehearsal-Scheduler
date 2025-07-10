const { MongoClient } = require('mongodb');

console.log('🗄️  MONGODB DATABASE VERIFICATION');
console.log('Checking what data is actually in the database...\n');

// MongoDB connection string (same as in backend)
const MONGODB_URI = 'mongodb+srv://rehearsal-user:123@cluster0.ma5xhcl.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority&appName=Cluster0';

async function checkDatabase() {
  let client;
  
  try {
    console.log('📡 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!\n');
    
    const db = client.db('rehearsal-scheduler');
    
    // Collections to check
    const collections = ['scenes', 'actors', 'rehearsals', 'timeslots'];
    
    console.log('📊 DATABASE CONTENTS:');
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`   ${collectionName}: ${count} documents`);
        
        if (count > 0) {
          // Get a sample document
          const sample = await collection.findOne();
          console.log(`   📋 Sample ${collectionName}: ${JSON.stringify(sample, null, 2).substring(0, 200)}...`);
        }
        console.log();
      } catch (error) {
        console.log(`   ❌ Error checking ${collectionName}: ${error.message}\n`);
      }
    }
    
    // Check if collections exist
    console.log('📂 COLLECTION STATUS:');
    const collections_list = await db.listCollections().toArray();
    console.log(`   Total collections: ${collections_list.length}`);
    collections_list.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    console.log('\n💡 This might indicate:');
    console.log('1. MongoDB Atlas connection string is wrong');
    console.log('2. Database credentials are incorrect');
    console.log('3. Network connectivity issues');
    console.log('4. Database name is different');
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔐 Database connection closed.');
    }
  }
}

checkDatabase();
