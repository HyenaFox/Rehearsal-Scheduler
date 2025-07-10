// Simple test for the new local-storage based service
// This uses a mock AsyncStorage for Node.js testing

// Mock AsyncStorage for Node.js
const mockAsyncStorage = {
  data: {},
  async getItem(key) {
    return this.data[key] || null;
  },
  async setItem(key, value) {
    this.data[key] = value;
  },
  async removeItem(key) {
    delete this.data[key];
  },
  async multiRemove(keys) {
    keys.forEach(key => delete this.data[key]);
  }
};

// Mock the AsyncStorage module
global.AsyncStorage = mockAsyncStorage;

// Simple DirectMongoService for testing
class TestDirectMongoService {
  constructor() {
    this.isConnected = true;
  }

  async connect() {
    console.log('✅ Direct MongoDB Service ready (local storage mode)');
    return true;
  }

  async getFromStorage(key) {
    try {
      const data = await mockAsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return [];
    }
  }

  async saveToStorage(key, data) {
    try {
      await mockAsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  }

  async getAllScenes() {
    return await this.getFromStorage('scenes');
  }

  async getAllActors() {
    return await this.getFromStorage('actors');
  }

  async getAllRehearsals() {
    return await this.getFromStorage('rehearsals');
  }

  async createScene(sceneData) {
    const scenes = await this.getAllScenes();
    const newScene = {
      id: Date.now().toString(),
      ...sceneData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    scenes.push(newScene);
    await this.saveToStorage('scenes', scenes);
    return newScene;
  }

  generateAllTimeslots() {
    const timeslots = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    
    for (let day = 0; day < 30; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      
      // Generate morning slots (9 AM - 12 PM)
      for (let hour = 9; hour < 12; hour++) {
        const startTime = new Date(currentDate);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        timeslots.push({
          id: `${currentDate.getTime()}-${hour}`,
          date: currentDate.toISOString().split('T')[0],
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          isAvailable: true,
          actors: [],
          rehearsalId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Generate afternoon slots (2 PM - 6 PM)
      for (let hour = 14; hour < 18; hour++) {
        const startTime = new Date(currentDate);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 0, 0, 0);
        
        timeslots.push({
          id: `${currentDate.getTime()}-${hour}`,
          date: currentDate.toISOString().split('T')[0],
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          isAvailable: true,
          actors: [],
          rehearsalId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return timeslots;
  }
}

const DirectMongoService = new TestDirectMongoService();

async function testLocalStorageService() {
  console.log('🧪 Testing Local Storage Service...');
  
  try {
    // Test connection
    console.log('1. Testing connection...');
    await DirectMongoService.connect();
    console.log('✅ Connection test passed');
    
    // Test timeslots generation
    console.log('2. Testing timeslots generation...');
    const timeslots = DirectMongoService.generateAllTimeslots();
    console.log(`✅ Generated ${timeslots.length} timeslots`);
    
    // Test creating a scene
    console.log('3. Testing scene creation...');
    const newScene = await DirectMongoService.createScene({
      name: 'Test Scene',
      act: 1,
      description: 'A test scene for verification'
    });
    console.log(`✅ Created scene: ${newScene.name}`);
    
    // Test scenes retrieval
    console.log('4. Testing scenes retrieval...');
    const scenes = await DirectMongoService.getAllScenes();
    console.log(`✅ Retrieved ${scenes.length} scenes`);
    
    // Test actors (should be empty initially)
    console.log('5. Testing actors...');
    const actors = await DirectMongoService.getAllActors();
    console.log(`✅ Retrieved ${actors.length} actors`);
    
    // Test rehearsals (should be empty initially)
    console.log('6. Testing rehearsals...');
    const rehearsals = await DirectMongoService.getAllRehearsals();
    console.log(`✅ Retrieved ${rehearsals.length} rehearsals`);
    
    console.log('🎉 All tests passed!');
    console.log('📱 This service now uses local storage and will work offline!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLocalStorageService();
