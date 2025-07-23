import { User } from '../contexts/AuthContext';
import { StorageService } from './storage';

// Use only the EXPO_PUBLIC_API_URL environment variable for the API base URL
const getApiBaseUrl = () => {
  // For local development, always use localhost:3000
  if (__DEV__) {
    const localApiUrl = 'http://localhost:3000/api';
    console.log(`⚠️ Development mode, forcing API URL to: ${localApiUrl}`);
    return localApiUrl;
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('🌐 Using EXPO_PUBLIC_API_URL from environment:', envUrl);
    return envUrl;
  }

  // Fallback for production if the env var isn't set for some reason
  return 'https://rehearsal-scheduler-backend.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('🌐 API Configuration:', {
  isDev: __DEV__,
  apiBaseUrl: API_BASE_URL,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
  environment: API_BASE_URL.includes('onrender.com') ? 'production' : 'development'
});

// Alternative URLs for different testing scenarios:
// 'http://localhost:3000/api' - Use this for web browser testing  
// 'http://10.0.2.2:3000/api' - Use this for Android emulator (RECOMMENDED for Google OAuth)
// 'http://192.168.1.159:3000/api' - Use this for physical device (but Google OAuth won't work)

class ApiService {
  private static async getAuthToken(): Promise<string | null> {
    try {
      return await StorageService.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private static async setAuthToken(token: string): Promise<void> {
    try {
      await StorageService.setItem('auth_token', token);
      console.log('🔑 Auth token stored successfully');
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  private static async removeAuthToken(): Promise<void> {
    try {
      await StorageService.removeItem('auth_token');
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
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });
      
      const fetchPromise = fetch(`${API_BASE_URL}${endpoint}`, config);
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
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

  static async googleLogin(tokenOrCode: string, isCode: boolean = false): Promise<{ token: string; user: any }> {
    const body = isCode 
      ? JSON.stringify({ code: tokenOrCode })
      : JSON.stringify({ token: tokenOrCode });
      
    return this.makeRequest('/auth/google', {
      method: 'POST',
      body,
    });
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

  static async updateProfile(updates: Partial<User>): Promise<any> {
    return await this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Actors API
  static async getAllActors(): Promise<any[]> {
    return this.makeRequest('/actors');
  }

  static async createActor(actor: any): Promise<any> {
    return this.makeRequest('/actors', {
      method: 'POST',
      body: JSON.stringify(actor),
    });
  }

  static async updateActor(id: string, actor: any): Promise<any> {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('Invalid actor ID provided');
    }
    console.log('🔄 ApiService: Updating actor with ID:', id);
    return this.makeRequest(`/actors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(actor),
    });
  }

  static async deleteActor(id: string): Promise<any> {
    return this.makeRequest(`/actors/${id}`, {
      method: 'DELETE',
    });
  }

  // Weekly Availability API
  static async getWeeklyAvailabilities(): Promise<any[]> {
    return this.makeRequest('/weekly-availability');
  }

  static async addWeeklyAvailability(availability: any): Promise<any> {
    return this.makeRequest('/weekly-availability', {
      method: 'POST',
      body: JSON.stringify(availability),
    });
  }

  static async deleteWeeklyAvailability(id: string): Promise<any> {
    return this.makeRequest(`/weekly-availability/${id}`, {
      method: 'DELETE',
    });
  }

  // Scenes API
  static async getAllScenes(): Promise<any[]> {
    return this.makeRequest('/scenes');
  }

  static async createScene(scene: any): Promise<any> {
    return this.makeRequest('/scenes', {
      method: 'POST',
      body: JSON.stringify(scene),
    });
  }

  static async updateScene(id: string, scene: any): Promise<any> {
    return this.makeRequest(`/scenes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scene),
    });
  }

  static async deleteScene(id: string): Promise<any> {
    return this.makeRequest(`/scenes/${id}`, {
      method: 'DELETE',
    });
  }

  // Rehearsals API
  static async getAllRehearsals(): Promise<any[]> {
    return this.makeRequest('/rehearsals');
  }

  static async createRehearsal(rehearsal: any): Promise<any> {
    return this.makeRequest('/rehearsals', {
      method: 'POST',
      body: JSON.stringify({
        title: rehearsal.title,
        timeslotId: rehearsal.timeslot.id || rehearsal.timeslot._id,
        timeslot: rehearsal.timeslot,
        actorIds: rehearsal.actors.map((actor: any) => actor.id),
        actors: rehearsal.actors
      }),
    });
  }

  static async updateRehearsal(id: string, rehearsal: any): Promise<any> {
    return this.makeRequest(`/rehearsals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: rehearsal.title,
        timeslotId: rehearsal.timeslot.id || rehearsal.timeslot._id,
        timeslot: rehearsal.timeslot,
        actorIds: rehearsal.actors.map((actor: any) => actor.id),
        actors: rehearsal.actors
      }),
    });
  }

  static async deleteRehearsal(id: string): Promise<any> {
    return this.makeRequest(`/rehearsals/${id}`, {
      method: 'DELETE',
    });
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

  // Google Calendar Integration Methods
  static async getGoogleAuthUrl(): Promise<string> {
    const response = await this.makeRequest('/calendar/auth/google');
    return response.authUrl;
  }

  static async handleGoogleCallback(code: string): Promise<any> {
    return this.makeRequest('/calendar/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  static async getGoogleCalendarStatus(): Promise<{
    connected: boolean;
    googleEmail?: string;
    hasAvailableSlots: boolean;
  }> {
    return this.makeRequest('/calendar/status');
  }

  static async getAvailableSlots(): Promise<{
    availableSlots: any[];
    busyEventsCount: number;
    dateRange: { from: string; to: string };
  }> {
    return this.makeRequest('/calendar/available-slots');
  }

  static async importGoogleCalendarAvailability(): Promise<{
    availableSlots: any[];
    unavailableSlots?: any[];
    totalTimeslots: number;
    busyEventsCount: number;
    dateRange: { from: string; to: string };
  }> {
    const response = await this.makeRequest('/calendar/import-availability');
    return response;
  }

  static async importSelectedSlots(selectedSlots: any[]): Promise<any> {
    return this.makeRequest('/calendar/import-slots', {
      method: 'POST',
      body: JSON.stringify({ selectedSlots }),
    });
  }

  static async disconnectGoogleCalendar(): Promise<any> {
    return this.makeRequest('/calendar/disconnect', {
      method: 'DELETE',
    });
  }
}

// Simple wrapper function for testing API connection
export async function testApiConnection() {
  console.log('🔍 Testing API connection...');
  try {
    const isBackendUp = await ApiService.testBackendConnection();
    return isBackendUp;
  } catch (error) {
    console.error('❌ API connection test failed:', error);
    return false;
  }
}

export default ApiService;
