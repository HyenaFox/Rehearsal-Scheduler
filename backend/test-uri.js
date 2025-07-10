console.log('=== MONGODB URI VALIDATION ===');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('URI exists:', !!uri);

if (uri) {
  console.log('URI length:', uri.length);
  console.log('URI starts with mongodb:', uri.startsWith('mongodb'));
  
  // Mask sensitive parts
  const maskedUri = uri.replace(/:[^:@]+@/, ':***@');
  console.log('Masked URI:', maskedUri);
  
  // Parse URI parts
  const uriParts = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
  if (uriParts) {
    console.log('Username:', uriParts[1]);
    console.log('Password length:', uriParts[2].length);
    console.log('Host:', uriParts[3]);
    console.log('Database:', uriParts[4]);
  }
}

console.log('=== QUICK CONNECTION TEST ===');
const mongoose = require('mongoose');

// Set a shorter timeout for testing
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 second timeout
  connectTimeoutMS: 10000
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  process.exit(0);
})
.catch((error) => {
  console.log('❌ MongoDB connection failed:', error.message);
  if (error.code) {
    console.log('Error code:', error.code);
  }
  process.exit(1);
});

// Timeout safety
setTimeout(() => {
  console.log('⏰ Connection timeout - check your network and MongoDB URI');
  process.exit(1);
}, 15000);
