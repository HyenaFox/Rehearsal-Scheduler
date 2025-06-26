import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' // For development
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

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
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
}

export default ApiService;
