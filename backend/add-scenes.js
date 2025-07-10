// Script to manually add scenes to the database
const mongoose = require('mongoose');
const Scene = require('./src/models/Scene');

const scenesToAdd = [
  {
    title: 'Cuban Missile Crisis',
    description: 'A tense political drama set during the 1962 Cuban Missile Crisis',
    actorsRequired: ['President Kennedy', 'Soviet Ambassador', 'Military Advisor'],
    location: 'Main Stage',
    duration: 90,
    priority: 8,
    createdBy: new mongoose.Types.ObjectId('000000000000000000000001')
  },
  {
    title: 'Joe Bones',
    description: 'A noir detective story featuring the mysterious Joe Bones',
    actorsRequired: ['Joe Bones', 'Detective', 'Witness'],
    location: 'Studio Theater',
    duration: 75,
    priority: 7,
    createdBy: new mongoose.Types.ObjectId('000000000000000000000001')
  }
];

async function addScenes() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/rehearsal-scheduler');
    
    console.log('🔍 Checking existing scenes...');
    const existingScenes = await Scene.find({});
    console.log(`Found ${existingScenes.length} existing scenes:`);
    existingScenes.forEach((scene, index) => {
      console.log(`  ${index + 1}. ${scene.title} (ID: ${scene._id})`);
    });
    
    console.log('\n🌱 Adding new scenes...');
    for (const sceneData of scenesToAdd) {
      const existingScene = await Scene.findOne({ title: sceneData.title });
      if (!existingScene) {
        console.log(`  ➕ Adding scene: ${sceneData.title}`);
        await Scene.create(sceneData);
      } else {
        console.log(`  ✅ Scene already exists: ${sceneData.title}`);
      }
    }
    
    console.log('\n📝 Final scene list:');
    const allScenes = await Scene.find({});
    allScenes.forEach((scene, index) => {
      console.log(`  ${index + 1}. ${scene.title} (ID: ${scene._id})`);
    });
    
    console.log('\n✅ Scene setup completed');
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

// Run this script only if called directly
if (require.main === module) {
  addScenes();
}

module.exports = { addScenes };
