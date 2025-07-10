// Test MongoDB connection
require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testMongoConnection() {
  console.log('🔍 Testing MongoDB connection...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('❌ No MONGODB_URI found in environment');
    return;
  }
  
  console.log('🔗 Connecting to MongoDB...');
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Test database access
    const db = client.db('rehearsal-scheduler');
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name));
    
    // Test getting data from each collection
    const scenes = await db.collection('scenes').find({}).limit(5).toArray();
    const actors = await db.collection('actors').find({}).limit(5).toArray();
    const rehearsals = await db.collection('rehearsals').find({}).limit(5).toArray();
    const timeslots = await db.collection('timeslots').find({}).limit(5).toArray();
    
    console.log('📊 Data summary:');
    console.log(`  - Scenes: ${scenes.length} found`);
    console.log(`  - Actors: ${actors.length} found`);
    console.log(`  - Rehearsals: ${rehearsals.length} found`);
    console.log(`  - Timeslots: ${timeslots.length} found`);
    
    if (scenes.length > 0) {
      console.log('🎭 Sample scene:', scenes[0]);
    }
    
    await client.close();
    console.log('✅ MongoDB connection test completed successfully');
    
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('🔧 Check your MONGODB_URI in backend/.env file');
  }
}

testMongoConnection();
