const mongoose = require('mongoose');

class MongoDB {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      // Get MongoDB connection string from environment
      const mongoURI = process.env.MONGODB_URI || process.env.DATABASE_URL;
      
      if (!mongoURI) {
        throw new Error('MONGODB_URI or DATABASE_URL environment variable is required');
      }

      // Connection options
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4 // Use IPv4, skip trying IPv6
      };

      // Connect to MongoDB
      this.connection = await mongoose.connect(mongoURI, options);
      
      console.log('✅ Connected to MongoDB successfully');
      console.log(`📍 Database: ${mongoose.connection.name}`);
      console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  getConnectionState() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState] || 'unknown';
  }
}

// Create singleton instance
const mongoDB = new MongoDB();

// Initialize database connection
const initDB = async () => {
  try {
    await mongoDB.connect();
    console.log('📦 Database initialization completed');
  } catch (error) {
    console.error('💥 Database initialization failed:', error);
    throw error;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  await mongoDB.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  await mongoDB.disconnect();
  process.exit(0);
});

module.exports = {
  initDB,
  mongoDB,
  mongoose
};
