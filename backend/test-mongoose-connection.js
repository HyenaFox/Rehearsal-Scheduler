// Test Mongoose connection
require('dotenv').config();
const mongoose = require('mongoose');

async function testMongooseConnection() {
  console.log('🔍 Testing Mongoose connection...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('❌ No MONGODB_URI found in environment');
    return;
  }
  
  console.log('🔗 Connecting to MongoDB with Mongoose...');
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Test database access
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections found:', collections.map(c => c.name));
    
    // Test getting data from collections
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
      console.log('🎭 Sample scene:', JSON.stringify(scenes[0], null, 2));
    }
    
    await mongoose.disconnect();
    console.log('✅ Mongoose connection test completed successfully');
    
  } catch (error) {
    console.log('❌ Mongoose connection failed:', error.message);
    console.log('🔧 Check your MONGODB_URI in backend/.env file');
  }
}

testMongooseConnection();
