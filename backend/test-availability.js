const mongoose = require('mongoose');
const User = require('./src/models/User.js');

mongoose.connect('mongodb+srv://blazeiscool7:RFBhJKi2E1lWIzm6@cluster0.ma5xhcl.mongodb.net/rehearsal-scheduler')
  .then(async () => {
    console.log('✅ Connected to database');
    const users = await User.find({}, 'name email availability').limit(10);
    console.log('\n📊 Users and their availability:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.availability ? user.availability.length : 0} availability slots`);
      if (user.availability && user.availability.length > 0) {
        console.log(`  First few slots: ${user.availability.slice(0, 3).join(', ')}`);
      }
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });
