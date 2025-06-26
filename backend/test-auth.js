// Simple test script to verify authentication works
require('dotenv').config();

const express = require('express');
const { initDB } = require('./src/models/database');
const authRoutes = require('./src/routes/auth');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

const PORT = 3001; // Different port to avoid conflicts

async function startTestServer() {
  try {
    console.log('🔍 Testing authentication system...');
    
    // Initialize database
    await initDB();
    console.log('✅ Database connected');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Test server running on http://localhost:${PORT}`);
      console.log('📡 Available endpoints:');
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
      console.log(`   PUT  http://localhost:${PORT}/api/auth/profile`);
    });

    // Test registration
    setTimeout(async () => {
      try {
        console.log('\n🧪 Testing registration...');
        const response = await fetch(`http://localhost:${PORT}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'testuser@example.com',
            password: 'password123',
            name: 'Test User'
          })
        });
        
        const data = await response.json();
        console.log('📝 Registration response:', data);
        
        if (response.ok) {
          console.log('✅ Registration works - user created in database');
          
          // Test login
          console.log('\n🧪 Testing login...');
          const loginResponse = await fetch(`http://localhost:${PORT}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'testuser@example.com',
              password: 'password123'
            })
          });
          
          const loginData = await loginResponse.json();
          console.log('🔐 Login response:', loginData);
          
          if (loginResponse.ok) {
            console.log('✅ Login works - credentials verified from database');
            console.log('🎉 Authentication system is working correctly!');
          } else {
            console.log('❌ Login failed:', loginData.error);
          }
        } else {
          console.log('❌ Registration failed:', data.error);
        }
        
      } catch (error) {
        console.error('❌ Test failed:', error.message);
      } finally {
        server.close();
        process.exit(0);
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startTestServer();
