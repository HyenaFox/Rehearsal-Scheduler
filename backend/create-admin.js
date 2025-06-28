const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('./src/models/User');

async function createAdmin() {
  try {
    console.log('� Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://tate:pass@cluster0.ma5xhcl.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');

    // Check if admin user already exists
    console.log('🔍 Checking if admin user exists...');
    let adminUser = await User.findOne({ email: 'admin@test.com' });

    if (!adminUser) {
      // Create the admin user
      console.log('� Creating admin user...');
      
      adminUser = new User({
        email: 'admin@test.com',
        password_hash: await bcrypt.hash('admin123', 10),
        name: 'System Administrator',
        phone: '',
        isActor: false,
        isAdmin: true,
        availableTimeslots: [],
        scenes: []
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    } else {
      console.log('ℹ️ Admin user already exists');
      
      // Update to admin if not already
      if (!adminUser.isAdmin) {
        console.log('🔧 Updating user to admin status...');
        adminUser.isAdmin = true;
        await adminUser.save();
        console.log('✅ User updated to admin status!');
      } else {
        console.log('✅ User is already an admin!');
      }
    }

    console.log('🎉 Admin setup complete!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    console.log('👑 Admin Status: true');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

createAdmin();
