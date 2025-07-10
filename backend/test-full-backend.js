// Test backend initialization and database connection
require('dotenv').config();
const mongoose = require('mongoose');

async function testFullBackendFlow() {
  console.log('🔍 Testing full backend initialization...');
  
  try {
    // 1. Test environment variables
    console.log('1. Checking environment variables...');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI not found in environment');
      return;
    }
    console.log('✅ MONGODB_URI found');
    
    // 2. Test mongoose connection
    console.log('2. Testing mongoose connection...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Mongoose connected successfully');
    
    // 3. Test database access
    console.log('3. Testing database access...');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections:', collections.map(c => c.name));
    
    // 4. Test Scene model
    console.log('4. Testing Scene model...');
    const Scene = require('./src/models/Scene');
    const scenes = await Scene.getAllScenes();
    console.log('🎭 Found scenes:', scenes.length);
    
    if (scenes.length > 0) {
      console.log('📝 Sample scene:', {
        id: scenes[0]._id,
        title: scenes[0].title,
        description: scenes[0].description
      });
    }
    
    // 5. Test direct collection access
    console.log('5. Testing direct collection access...');
    const directScenes = await db.collection('scenes').find({}).limit(5).toArray();
    console.log('📊 Direct scenes query:', directScenes.length);
    
    await mongoose.disconnect();
    console.log('✅ All tests completed successfully');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('Stack:', error.stack);
  }
}

testFullBackendFlow();
