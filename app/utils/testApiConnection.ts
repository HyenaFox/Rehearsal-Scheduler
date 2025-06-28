// Simple API connection test for React Native
import ApiService from '../services/api';

export async function testApiConnection() {
  console.log('🔍 Testing API connection...');
  
  try {
    // Test if we can reach the backend using API service
    const isBackendUp = await ApiService.testBackendConnection();
    
    if (isBackendUp) {
      console.log('✅ Backend connection successful!');
      return true;
    } else {
      console.log('❌ Backend is not responding');
      return false;
    }
    
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    return false;
  }
}
