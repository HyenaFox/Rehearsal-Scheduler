// Simple test for MongoDB connection
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables first
dotenv.config();

async function testMongoConnection() {
  console.log('🧪 Testing MongoDB Connection...');
  
  const mongoUri = process.env.EXPO_PUBLIC_MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MongoDB URI not found in environment variables');
    console.log('Available environment variables:');
    console.log(Object.keys(process.env).filter(key => key.includes('MONGO')));
    return;
  }
  
  console.log('✅ MongoDB URI found');
  
  try {
    console.log('1. Connecting to MongoDB...');
    const client = new MongoClient(mongoUri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    console.log('2. Testing database access...');
    const db = client.db('rehearsal-scheduler');
    const collections = await db.listCollections().toArray();
    console.log(`✅ Database accessible, found ${collections.length} collections`);
    
    console.log('3. Testing scenes collection...');
    const scenesCollection = db.collection('scenes');
    const sceneCount = await scenesCollection.countDocuments();
    console.log(`✅ Scenes collection accessible, ${sceneCount} documents`);
    
    console.log('4. Testing actors collection...');
    const actorsCollection = db.collection('actors');
    const actorCount = await actorsCollection.countDocuments();
    console.log(`✅ Actors collection accessible, ${actorCount} documents`);
    
    console.log('5. Testing rehearsals collection...');
    const rehearsalsCollection = db.collection('rehearsals');
    const rehearsalCount = await rehearsalsCollection.countDocuments();
    console.log(`✅ Rehearsals collection accessible, ${rehearsalCount} documents`);
    
    await client.close();
    console.log('✅ Connection closed');
    
    console.log('🎉 All MongoDB tests passed!');
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error.message);
  }
}

testMongoConnection();
