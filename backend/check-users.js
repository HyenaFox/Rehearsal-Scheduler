require('dotenv').config();
const { MongoClient } = require('mongodb');

async function checkDatabase() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    const users = await db.collection('users').find({}).toArray();
    
    console.log('=== CURRENT DATABASE USERS ===');
    console.log('Total users:', users.length);
    console.log('');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Is Actor: ${user.isActor}`);
      console.log(`   Created: ${user.createdAt || 'Unknown'}`);
      console.log(`   Available Timeslots: ${user.availableTimeslots?.length || 0}`);
      console.log('');
    });
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();
