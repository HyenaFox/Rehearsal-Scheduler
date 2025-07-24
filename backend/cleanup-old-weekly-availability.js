require('dotenv').config();
const mongoose = require('mongoose');

async function deleteSpecificBadRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the direct collection to bypass the model schema validation
    const db = mongoose.connection.db;
    const collection = db.collection('weeklyavailabilities');
    
    // Check all documents
    const allDocs = await collection.find({}).toArray();
    console.log('📊 Found', allDocs.length, 'total documents in collection');
    
    // Find documents that have the old schema (missing the new required fields)
    const badDocs = allDocs.filter(doc => 
      !doc.hasOwnProperty('dayOfWeek') || 
      !doc.hasOwnProperty('startTime') || 
      !doc.hasOwnProperty('endTime')
    );
    
    console.log('🔍 Found', badDocs.length, 'documents with old schema');
    badDocs.forEach((doc, i) => {
      console.log(`  ${i+1}. ID: ${doc._id}, fields: ${Object.keys(doc).join(', ')}`);
    });
    
    if (badDocs.length > 0) {
      console.log('🗑️ Deleting old schema documents...');
      const idsToDelete = badDocs.map(doc => doc._id);
      const result = await collection.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`✅ Deleted ${result.deletedCount} old schema documents`);
    }
    
    // Show final state
    const finalDocs = await collection.find({}).toArray();
    console.log('📊 Final document count:', finalDocs.length);
    finalDocs.forEach((doc, i) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      console.log(`  ${i+1}. ${days[doc.dayOfWeek]} ${doc.startTime} - ${doc.endTime}`);
    });
    
    await mongoose.disconnect();
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

deleteSpecificBadRecords();
