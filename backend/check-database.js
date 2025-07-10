const mongoose = require('mongoose');
const Scene = require('./src/models/Scene');
const Timeslot = require('./src/models/Timeslot');
const Actor = require('./src/models/Actor');
const Rehearsal = require('./src/models/Rehearsal');

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/rehearsal-scheduler');
    
    console.log('\n📝 Checking Scenes:');
    const scenes = await Scene.find();
    console.log(`Found ${scenes.length} scenes:`);
    scenes.forEach((scene, index) => {
      console.log(`  ${index + 1}. ${scene.title || scene.name} (ID: ${scene._id})`);
    });
    
    console.log('\n⏰ Checking Timeslots:');
    const timeslots = await Timeslot.find();
    console.log(`Found ${timeslots.length} timeslots:`);
    timeslots.forEach((timeslot, index) => {
      console.log(`  ${index + 1}. ${timeslot.day} ${timeslot.startTime}-${timeslot.endTime} (ID: ${timeslot._id})`);
    });
    
    console.log('\n👤 Checking Actors:');
    const actors = await Actor.find();
    console.log(`Found ${actors.length} actors:`);
    actors.forEach((actor, index) => {
      console.log(`  ${index + 1}. ${actor.name} (ID: ${actor._id})`);
    });
    
    console.log('\n🎭 Checking Rehearsals:');
    const rehearsals = await Rehearsal.find().populate('timeslot');
    console.log(`Found ${rehearsals.length} rehearsals:`);
    rehearsals.forEach((rehearsal, index) => {
      console.log(`  ${index + 1}. ${rehearsal.title} (ID: ${rehearsal._id})`);
    });
    
    console.log('\n✅ Database check completed');
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Database check failed:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

checkDatabase();
