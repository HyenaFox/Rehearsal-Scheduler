import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.159:3000/api' // For physical device (use localhost:3000/api for emulator)
  : 'https://rehearsal-scheduler.onrender.com/api'; // Your Render.com URL

class ApiService {
  private static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private static async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
      console.log('🔑 Auth token stored successfully');
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  private static async removeAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
      console.log('🔑 Auth token removed successfully');
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  private static async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint}`);
    console.log(`🌐 Request config:`, { 
      method: options.method || 'GET', 
      hasToken: !!token,
      hasBody: !!options.body 
    });

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      console.log(`🌐 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.log(`🌐 Error response:`, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      console.log(`🌐 Success response received for ${endpoint}`);
      return responseData;
    } catch (error) {
      console.error('🌐 API request error:', error);
      throw error;
    }
  }

  // Auth methods
  static async register(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) {
    const response = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      await this.setAuthToken(response.token);
    }

    return response;
  }

  static async login(credentials: { email: string; password: string }) {
    console.log('🔐 Attempting login for:', credentials.email);
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    console.log('🔐 Login response received:', { hasToken: !!response.token, hasUser: !!response.user });

    if (response.token) {
      await this.setAuthToken(response.token);
      console.log('🔐 Login successful, token stored');
    } else {
      console.log('🔐 Login failed - no token received');
    }

    return response;
  }

  static async logout() {
    await this.removeAuthToken();
  }

  static async getCurrentUser() {
    console.log('🔍 Getting current user...');
    try {
      const result = await this.makeRequest('/auth/me');
      console.log('🔍 Current user result:', result ? 'User found' : 'No user');
      return result;
    } catch (error) {
      console.log('🔍 Get current user failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  static async updateProfile(profileData: {
    name: string;
    phone?: string;
    isActor: boolean;
    availableTimeslots?: string[];
    scenes?: string[];
  }) {
    return await this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Actor methods
  static async getAllActors() {
    return await this.makeRequest('/actors');
  }

  // Health check
  static async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Debug methods - remove these after testing
  static async debugTokenStorage() {
    const token = await this.getAuthToken();
    console.log('🔍 Current stored token:', token ? `${token.substring(0, 20)}...` : 'No token');
    return !!token;
  }

  static async debugClearToken() {
    await this.removeAuthToken();
    console.log('🔍 Token cleared for debugging');
  }

  // Test backend connection
  static async testBackendConnection() {
    console.log('🧪 Testing backend connection...');
    try {
      const health = await this.healthCheck();
      console.log('🧪 Health check result:', health);
      
      if (!health) {
        console.log('❌ Backend is not responding');
        return false;
      }
      
      console.log('✅ Backend is responding correctly');
      return true;
    } catch (error) {
      console.log('❌ Backend connection failed:', error);
      return false;
    }
  }

  // Test registration flow
  static async testRegistration(email: string, password: string, name: string) {
    console.log('🧪 Testing registration flow...');
    try {
      const result = await this.register({ email, password, name });
      console.log('🧪 Registration result:', { hasToken: !!result.token, hasUser: !!result.user });
      return result;
    } catch (error) {
      console.log('🧪 Registration failed:', error);
      throw error;
    }
  }

  // Test login flow
  static async testLogin(email: string, password: string) {
    console.log('🧪 Testing login flow...');
    try {
      const result = await this.login({ email, password });
      console.log('🧪 Login result:', { hasToken: !!result.token, hasUser: !!result.user });
      return result;
    } catch (error) {
      console.log('🧪 Login failed:', error);
      throw error;
    }
  }
}

export default ApiService;
