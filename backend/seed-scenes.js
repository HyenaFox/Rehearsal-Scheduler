const mongoose = require('mongoose');
const Scene = require('./src/models/Scene');

const defaultScenes = [
  {
    title: 'Cuban Missile Crisis',
    description: 'A tense political drama set during the 1962 Cuban Missile Crisis',
    actorsRequired: ['President Kennedy', 'Soviet Ambassador', 'Military Advisor'],
    location: 'Main Stage',
    duration: 90,
    priority: 8
  },
  {
    title: 'Joe Bones',
    description: 'A noir detective story featuring the mysterious Joe Bones',
    actorsRequired: ['Joe Bones', 'Detective', 'Witness'],
    location: 'Studio Theater',
    duration: 75,
    priority: 7
  },
  {
    title: 'The Morning Show',
    description: 'A comedy set in a morning television studio',
    actorsRequired: ['Host', 'Co-Host', 'Producer'],
    location: 'Studio Set',
    duration: 60,
    priority: 6
  },
  {
    title: 'Family Reunion',
    description: 'A heartwarming family drama',
    actorsRequired: ['Father', 'Mother', 'Child'],
    location: 'Living Room Set',
    duration: 80,
    priority: 5
  }
];

async function seedScenes() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/rehearsal-scheduler');
    
    console.log('🌱 Seeding scenes...');
    
    for (const sceneData of defaultScenes) {
      const existingScene = await Scene.findOne({ title: sceneData.title });
      
      if (!existingScene) {
        console.log(`  ➕ Creating scene: ${sceneData.title}`);
        await Scene.create(sceneData);
      } else {
        console.log(`  ✅ Scene already exists: ${sceneData.title}`);
      }
    }
    
    console.log('🌱 Scene seeding completed');
    
    // Show all scenes
    const allScenes = await Scene.find();
    console.log(`\n📝 Total scenes in database: ${allScenes.length}`);
    allScenes.forEach((scene, index) => {
      console.log(`  ${index + 1}. ${scene.title} (ID: ${scene._id})`);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Scene seeding failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

seedScenes();
