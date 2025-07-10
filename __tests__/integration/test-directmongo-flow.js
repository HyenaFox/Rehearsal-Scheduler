// Test script that mimics exactly what DirectMongoService does
const http = require('http');
const https = require('https');

console.log('🎭 DIRECTMONGOSERVICE SIMULATION');
console.log('Testing the exact same flow as your frontend...\n');

// Read the current environment (same as DirectMongoService)
const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
console.log(`📡 Base URL: ${baseUrl}`);

// Simple fetch replacement for Node.js
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 5000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const response = {
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data)
        };
        resolve(response);
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Simulate the DirectMongoService class
class TestDirectMongoService {
  constructor() {
    this.baseUrl = baseUrl;
    this.isConnected = false;
    console.log(`🔧 DirectMongoService initialized with baseUrl: ${this.baseUrl}`);
  }

  async connect() {
    console.log('\n🔌 Testing connection...');
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend connection failed: ${response.status}`);
      }

      this.isConnected = true;
      const data = await response.json();
      console.log('✅ Connection successful!');
      console.log(`📊 Backend info: ${data.name || 'Unknown'}`);
      return true;
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      this.isConnected = false;
      throw error;
    }
  }

  async apiCall(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const fullUrl = `${this.baseUrl}${endpoint}`;
    console.log(`📡 Making API call to: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAllScenes() {
    try {
      console.log('\n🎬 Getting all scenes...');
      const scenes = await this.apiCall('/api/scenes');
      console.log(`✅ Scenes retrieved: ${scenes.length} items`);
      if (scenes.length > 0) {
        console.log(`📋 First scene: ${JSON.stringify(scenes[0], null, 2).substring(0, 200)}...`);
      }
      return scenes;
    } catch (error) {
      console.log(`❌ Error fetching scenes: ${error.message}`);
      throw error;
    }
  }

  async getAllActors() {
    try {
      console.log('\n👥 Getting all actors...');
      const actors = await this.apiCall('/api/actors');
      console.log(`✅ Actors retrieved: ${actors.length} items`);
      if (actors.length > 0) {
        console.log(`📋 First actor: ${JSON.stringify(actors[0], null, 2).substring(0, 200)}...`);
      }
      return actors;
    } catch (error) {
      console.log(`❌ Error fetching actors: ${error.message}`);
      throw error;
    }
  }

  async getAllRehearsals() {
    try {
      console.log('\n🎭 Getting all rehearsals...');
      const rehearsals = await this.apiCall('/api/rehearsals');
      console.log(`✅ Rehearsals retrieved: ${rehearsals.length} items`);
      if (rehearsals.length > 0) {
        console.log(`📋 First rehearsal: ${JSON.stringify(rehearsals[0], null, 2).substring(0, 200)}...`);
      }
      return rehearsals;
    } catch (error) {
      console.log(`❌ Error fetching rehearsals: ${error.message}`);
      throw error;
    }
  }

  async getAllTimeslots() {
    try {
      console.log('\n⏰ Getting all timeslots...');
      const timeslots = await this.apiCall('/api/timeslots');
      console.log(`✅ Timeslots retrieved: ${timeslots.length} items`);
      if (timeslots.length > 0) {
        console.log(`📋 First timeslot: ${JSON.stringify(timeslots[0], null, 2).substring(0, 200)}...`);
      }
      return timeslots;
    } catch (error) {
      console.log(`❌ Error fetching timeslots: ${error.message}`);
      throw error;
    }
  }
}

// Polyfill fetch for Node.js (if not available)
// if (typeof fetch === 'undefined') {
//   global.fetch = require('node-fetch');
// }

// Run the test
async function runTest() {
  const service = new TestDirectMongoService();
  
  try {
    // Test connection
    await service.connect();
    
    // Test all endpoints
    const scenes = await service.getAllScenes();
    const actors = await service.getAllActors();
    const rehearsals = await service.getAllRehearsals();
    const timeslots = await service.getAllTimeslots();
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Scenes: ${scenes.length}`);
    console.log(`   Actors: ${actors.length}`);
    console.log(`   Rehearsals: ${rehearsals.length}`);
    console.log(`   Timeslots: ${timeslots.length}`);
    
    if (scenes.length === 0 && actors.length === 0 && rehearsals.length === 0) {
      console.log('\n⚠️  WARNING: All collections are empty!');
      console.log('   This suggests either:');
      console.log('   1. The database is empty');
      console.log('   2. The backend is not connected to the right database');
      console.log('   3. There are authentication issues');
      console.log('   4. The data was lost during migration');
    }
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    console.log('\n💡 This is exactly what your frontend is experiencing!');
    console.log('   Check:');
    console.log('   1. Is the backend server running?');
    console.log('   2. Is the backend connected to MongoDB?');
    console.log('   3. Are the API routes working?');
  }
}

runTest();
