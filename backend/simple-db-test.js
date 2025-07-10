console.log('=== BACKEND DATABASE TEST ===');
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());

// Load environment
require('dotenv').config();
console.log('Environment loaded');
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

// Test basic import
try {
  const mongoose = require('mongoose');
  console.log('✅ Mongoose imported successfully');
  
  // Test connection
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ Connected to MongoDB');
      return mongoose.connection.db.listCollections().toArray();
    })
    .then((collections) => {
      console.log('📁 Collections:', collections.map(c => c.name));
      return mongoose.disconnect();
    })
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
    
} catch (error) {
  console.error('❌ Import error:', error.message);
  process.exit(1);
}
