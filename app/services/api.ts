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

  // Fallback for combined deployment - relative API URL
  return '/api';
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
  // Cookie-based authentication - no token management needed
  private static async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies in requests (this is the key for cookie auth)
      ...options,
    };

    // For development, also try to get token from localStorage as fallback
    const isWebDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (__DEV__ || isWebDev) {
      try {
        const { StorageService } = await import('./storage');
        const token = await StorageService.getItem('auth_token');
        if (token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`,
          };
          console.log('🔐 Using localStorage token for request (length:', token.length, ')');
        } else {
          console.log('🔐 No localStorage token found, relying on cookies');
        }
      } catch (error) {
        console.log('🔐 Failed to get localStorage token:', error);
        // Ignore error, cookies will be used
      }
    }

    console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint}`);
    console.log(`🌐 Request config:`, { 
      method: options.method || 'GET', 
      hasBody: !!options.body,
      credentials: config.credentials,
      hasAuth: !!(config.headers as any)?.Authorization,
      headers: config.headers
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

  // Public request method (no auth required)
  private static async makePublicRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log(`🌐 Making public request to: ${API_BASE_URL}${endpoint}`);
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000);
      });
      
      const fetchPromise = fetch(`${API_BASE_URL}${endpoint}`, config);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log(`🌐 Public response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        console.log(`🌐 Public error response:`, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const responseData = await response.json();
      console.log(`🌐 Public success response received for ${endpoint}`);
      return responseData;
    } catch (error) {
      console.error('🌐 Public API request error:', error);
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

    // For development, also store token in localStorage as fallback
    if (__DEV__ && response.token) {
      try {
        const { StorageService } = await import('./storage');
        await StorageService.setItem('auth_token', response.token);
        console.log('🔐 Registration successful - token stored in both cookie and localStorage');
      } catch (error) {
        console.log('🔐 Registration successful - cookie will be used (localStorage failed)');
      }
    } else {
      console.log('🔐 Registration successful - cookie will be set by server');
    }
    
    return response;
  }

  static async login(credentials: { email: string; password: string }) {
    console.log('🔐 Attempting login for:', credentials.email);
    const response = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    console.log('🔐 Login response received:', { hasUser: !!response.user });
    
    // For development, also store token in localStorage as fallback
    if (__DEV__ && response.token) {
      try {
        const { StorageService } = await import('./storage');
        await StorageService.setItem('auth_token', response.token);
        console.log('🔐 Login successful - token stored in both cookie and localStorage');
      } catch (error) {
        console.log('🔐 Login successful - cookie will be used (localStorage failed)');
      }
    } else {
      console.log('🔐 Login successful - cookie will be set by server');
    }
    
    return response;
  }

  static async googleLogin(tokenOrCode: string, isCode: boolean = false): Promise<{ token: string; user: any }> {
    console.log('🔐 🔍 DEBUGGING: ApiService.googleLogin called with:', {
      hasTokenOrCode: !!tokenOrCode,
      tokenOrCodeLength: tokenOrCode?.length,
      isCode,
      tokenOrCodePreview: tokenOrCode?.substring(0, 30) + '...'
    });
    
    const body = isCode 
      ? JSON.stringify({ code: tokenOrCode })
      : JSON.stringify({ token: tokenOrCode });
      
    console.log('🔐 🔍 DEBUGGING: Making request to /auth/google with:', {
      bodyType: isCode ? 'code' : 'token',
      bodyLength: body.length
    });
    
    try {
      const response = await this.makeRequest('/auth/google', {
        method: 'POST',
        body,
      });
      
      console.log('🔐 🔍 DEBUGGING: /auth/google response received:', {
        hasToken: !!response.token,
        hasUser: !!response.user,
        userEmail: response.user?.email,
        userName: response.user?.name,
        message: response.message
      });
      
      // For development, also store token in localStorage as fallback
      if (__DEV__ && response.token) {
        try {
          await StorageService.setItem('auth_token', response.token);
          console.log('🔐 Google login successful - token stored in both cookie and localStorage');
        } catch {
          console.log('🔐 Google login successful - cookie will be used (localStorage failed)');
        }
      }
      
      return response;
    } catch (error) {
      console.error('🔐 🔍 DEBUGGING: /auth/google request failed:', {
        message: (error as any)?.message,
        status: (error as any)?.status,
        stack: (error as any)?.stack?.substring(0, 300)
      });
      throw error;
    }
  }

  static async logout() {
    try {
      // For development, also clear localStorage
      if (__DEV__) {
        try {
          const { StorageService } = await import('./storage');
          await StorageService.removeItem('auth_token');
          console.log('🔐 localStorage token cleared');
        } catch {
          // Ignore error
        }
      }
      
      // Call backend logout endpoint to clear HTTP-only cookie
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
      console.log('🔐 Backend logout successful - cookie cleared');
    } catch (error) {
      console.log('🔐 Backend logout failed:', error);
      // Don't throw - allow local logout to proceed
    }
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
    console.log('🌐 ApiService.updateProfile called with:', updates);
    console.log('🌐 Availability data being sent:', updates.availability?.length || 0, 'slots');
    if (updates.availability && updates.availability.length > 0) {
      console.log('🌐 Sample availability slots:', updates.availability.slice(0, 3));
    }
    
    const result = await this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    console.log('🌐 ApiService.updateProfile result:', result);
    console.log('🌐 Result availability:', result?.user?.availability?.length || 0, 'slots');
    return result;
  }

  // Actors API
  static async getAllActors(): Promise<any[]> {
    return this.makeRequest('/actors');
  }

  static async getPublicActors(): Promise<any[]> {
    // Public endpoint that doesn't require authentication
    const response = await fetch(`${API_BASE_URL}/actors/public`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
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
    return this.makePublicRequest('/weekly-availability');
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
        // Handle both old timeslot format and new date/time format
        timeslotId: rehearsal.timeslot?.id || rehearsal.timeslot?._id || null,
        timeslot: rehearsal.timeslot || null,
        date: rehearsal.date || null,
        time: rehearsal.time || null,
        scene: rehearsal.scene || null,
        actorIds: rehearsal.actors?.map((actor: any) => actor.id || actor._id) || [],
        actors: rehearsal.actors || []
      }),
    });
  }

  static async updateRehearsal(id: string, rehearsal: any): Promise<any> {
    return this.makeRequest(`/rehearsals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: rehearsal.title,
        // Handle both old timeslot format and new date/time format
        timeslotId: rehearsal.timeslot?.id || rehearsal.timeslot?._id || null,
        timeslot: rehearsal.timeslot || null,
        date: rehearsal.date || null,
        time: rehearsal.time || null,
        scene: rehearsal.scene || null,
        actorIds: rehearsal.actors?.map((actor: any) => actor.id || actor._id) || [],
        actors: rehearsal.actors || []
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

  static async exchangeGoogleCode(code: string, state?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    console.log('🔄 ApiService: Exchanging Google OAuth code...');
    return this.makeRequest('/calendar/auth/google/exchange-code', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
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

  static async disconnectGoogleCalendar(): Promise<{
    success: boolean;
    message: string;
  }> {
    console.log('🔌 ApiService: Starting disconnectGoogleCalendar...');
    try {
      const result = await this.makeRequest('/calendar/disconnect', { method: 'DELETE' });
      console.log('🔌 ApiService: Disconnect successful:', result);
      return result;
    } catch (error) {
      console.error('🔌 ApiService: Disconnect failed:', error);
      throw error;
    }
  }

  static async importSelectedSlots(selectedSlots: any[]): Promise<any> {
    return this.makeRequest('/calendar/import-slots', {
      method: 'POST',
      body: JSON.stringify({ selectedSlots }),
    });
  }

  // Poll management methods
  static async getPolls(): Promise<any[]> {
    console.log('🗳️ ApiService: Getting polls...');
    return this.makeRequest('/polls');
  }

  static async getPoll(pollId: string): Promise<any> {
    console.log('🗳️ ApiService: Getting poll:', pollId);
    return this.makeRequest(`/polls/${pollId}`);
  }

  static async createPoll(pollData: {
    title: string;
    description?: string;
    dateRanges?: Array<{
      id: string;
      date: string;
      earliestTime: string;
      latestTime: string;
      suggestedDuration?: number;
      description?: string;
    }>;
    timeSlots?: Array<{
      date: string;
      startTime: string;
      endTime: string;
      description?: string;
    }>;
    scenes?: string[];
    targetActorIds: string[];
    settings?: {
      allowMultipleSelections?: boolean;
      requireAllActors?: boolean;
      showResponsesPublically?: boolean;
      allowComments?: boolean;
      deadline?: string;
      timezone?: string;
    };
  }): Promise<any> {
    console.log('🗳️ ApiService: Creating poll...', pollData);
    return this.makeRequest('/polls', {
      method: 'POST',
      body: JSON.stringify(pollData),
    });
  }

  static async updatePoll(pollId: string, updates: any): Promise<any> {
    console.log('🗳️ ApiService: Updating poll:', pollId, updates);
    return this.makeRequest(`/polls/${pollId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  static async submitPollResponse(pollId: string, responseData: {
    timeSlotId?: string;
    dateRangeId?: string;
    availabilityBlocks?: Array<{
      startTime: string;
      endTime: string;
      responseType: 'available' | 'if-needed';
    }>;
    responseType?: 'available' | 'if-needed' | 'not-available';
    comment?: string;
  }): Promise<any> {
    console.log('🗳️ ApiService: Submitting poll response:', pollId, responseData);
    return this.makeRequest(`/polls/${pollId}/responses`, {
      method: 'POST',
      body: JSON.stringify(responseData),
    });
  }

  static async getPollSummary(pollId: string): Promise<any> {
    console.log('🗳️ ApiService: Getting poll summary:', pollId);
    return this.makeRequest(`/polls/${pollId}/summary`);
  }

  static async duplicatePoll(pollId: string, modifications?: any): Promise<any> {
    console.log('🗳️ ApiService: Duplicating poll:', pollId, modifications);
    return this.makeRequest(`/polls/${pollId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(modifications || {}),
    });
  }

  static async deletePoll(pollId: string): Promise<any> {
    console.log('🗳️ ApiService: Deleting poll:', pollId);
    return this.makeRequest(`/polls/${pollId}`, {
      method: 'DELETE',
    });
  }

  static async exportPollCSV(pollId: string): Promise<Blob> {
    console.log('🗳️ ApiService: Exporting poll CSV:', pollId);
    // For CSV export, we need to handle the response differently
    const response = await fetch(`${API_BASE_URL}/polls/${pollId}/export`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${await StorageService.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export poll data');
    }

    return response.blob();
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
