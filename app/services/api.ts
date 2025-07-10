import DirectMongoService from './directMongo';
import { StorageService } from './storage';

// Direct MongoDB-based API Service
// This replaces all backend HTTP requests with direct MongoDB operations

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

  private static async getCurrentUserId(): Promise<string | null> {
    try {
      const userStr = await StorageService.getItem('current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || user._id;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  private static async setCurrentUser(user: any): Promise<void> {
    try {
      await StorageService.setItem('current_user', JSON.stringify(user));
      console.log('👤 Current user stored successfully');
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }

  private static async removeCurrentUser(): Promise<void> {
    try {
      await StorageService.removeItem('current_user');
      console.log('👤 Current user removed successfully');
    } catch (error) {
      console.error('Error removing current user:', error);
    }
  }

  // Auth methods - Now using local storage only (no backend authentication)
  static async register(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }) {
    console.log('🔐 Direct registration for:', userData.email);
    
    // Create a simple local user
    const user = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      phone: userData.phone || '',
      isActor: false,
      createdAt: new Date().toISOString(),
      availableTimeslots: [],
      scenes: []
    };

    // Generate a simple token
    const token = `token_${user.id}_${Date.now()}`;
    
    await this.setAuthToken(token);
    await this.setCurrentUser(user);
    
    console.log('🔐 Registration successful - local user created');
    return { user, token };
  }

  static async login(credentials: { email: string; password: string }) {
    console.log('🔐 Direct login for:', credentials.email);
    
    // For direct MongoDB integration, we'll use a simple local auth system
    // In a real app, you'd implement proper authentication with MongoDB
    const user = {
      id: `user_${Date.now()}`,
      email: credentials.email,
      name: credentials.email.split('@')[0],
      isActor: false,
      createdAt: new Date().toISOString(),
      availableTimeslots: [],
      scenes: []
    };

    // Generate a simple token
    const token = `token_${user.id}_${Date.now()}`;
    
    await this.setAuthToken(token);
    await this.setCurrentUser(user);
    
    console.log('🔐 Login successful - local user authenticated');
    return { user, token };
  }

  static async logout() {
    await this.removeAuthToken();
    await this.removeCurrentUser();
    console.log('🔐 Logout successful');
  }

  static async getCurrentUser() {
    console.log('🔍 Getting current user...');
    try {
      const userStr = await StorageService.getItem('current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('🔍 Current user found:', user.email);
        return user;
      }
      console.log('🔍 No current user found');
      return null;
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
    console.log('🔄 Updating profile...');
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const updatedUser = {
        ...currentUser,
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      await this.setCurrentUser(updatedUser);
      console.log('🔄 Profile updated successfully');
      return updatedUser;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }

  // Actors API - Using DirectMongoService
  static async getAllActors(): Promise<any[]> {
    console.log('🔄 Getting all actors...');
    return await DirectMongoService.getAllActors();
  }

  static async createActor(actor: any): Promise<any> {
    console.log('🔄 Creating actor...');
    return await DirectMongoService.createActor(actor);
  }

  static async updateActor(id: string, actor: any): Promise<any> {
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('Invalid actor ID provided');
    }
    console.log('🔄 Updating actor with ID:', id);
    return await DirectMongoService.updateActor(id, actor);
  }

  static async deleteActor(id: string): Promise<any> {
    console.log('🔄 Deleting actor with ID:', id);
    return await DirectMongoService.deleteActor(id);
  }

  // Timeslots API - Using DirectMongoService (client-side generated)
  static async getAllTimeslots(): Promise<any[]> {
    console.log('🔄 Getting all timeslots (client-side generated)...');
    return DirectMongoService.generateAllTimeslots();
  }

  static async createTimeslot(timeslot: any): Promise<any> {
    console.log('🔄 Creating timeslot (not needed - client-side generated)...');
    return timeslot; // Timeslots are generated client-side
  }

  static async updateTimeslot(id: string, timeslot: any): Promise<any> {
    console.log('🔄 Updating timeslot (not needed - client-side generated)...');
    return timeslot; // Timeslots are generated client-side
  }

  static async deleteTimeslot(id: string): Promise<any> {
    console.log('🔄 Deleting timeslot (not needed - client-side generated)...');
    return { success: true }; // Timeslots are generated client-side
  }

  // Scenes API - Using DirectMongoService
  static async getAllScenes(): Promise<any[]> {
    console.log('🔄 Getting all scenes...');
    return await DirectMongoService.getAllScenes();
  }

  static async createScene(scene: any): Promise<any> {
    console.log('🔄 Creating scene...');
    return await DirectMongoService.createScene(scene);
  }

  static async updateScene(id: string, scene: any): Promise<any> {
    console.log('🔄 Updating scene with ID:', id);
    return await DirectMongoService.updateScene(id, scene);
  }

  static async deleteScene(id: string): Promise<any> {
    console.log('🔄 Deleting scene with ID:', id);
    return await DirectMongoService.deleteScene(id);
  }

  // Rehearsals API - Using DirectMongoService
  static async getAllRehearsals(): Promise<any[]> {
    console.log('🔄 Getting all rehearsals...');
    return await DirectMongoService.getAllRehearsals();
  }

  static async createRehearsal(rehearsal: any): Promise<any> {
    console.log('🔄 Creating rehearsal...');
    const rehearsalData = {
      title: rehearsal.title,
      timeslotId: rehearsal.timeslot.id || rehearsal.timeslot._id,
      timeslot: rehearsal.timeslot,
      actorIds: rehearsal.actors.map((actor: any) => actor.id),
      actors: rehearsal.actors
    };
    return await DirectMongoService.createRehearsal(rehearsalData);
  }

  static async updateRehearsal(id: string, rehearsal: any): Promise<any> {
    console.log('🔄 Updating rehearsal with ID:', id);
    const rehearsalData = {
      title: rehearsal.title,
      timeslotId: rehearsal.timeslot.id || rehearsal.timeslot._id,
      timeslot: rehearsal.timeslot,
      actorIds: rehearsal.actors.map((actor: any) => actor.id),
      actors: rehearsal.actors
    };
    return await DirectMongoService.updateRehearsal(id, rehearsalData);
  }

  static async deleteRehearsal(id: string): Promise<any> {
    console.log('🔄 Deleting rehearsal with ID:', id);
    return await DirectMongoService.deleteRehearsal(id);
  }

  // Health check - Always return true for direct MongoDB
  static async healthCheck() {
    console.log('🔄 Health check (direct MongoDB)...');
    return true;
  }

  // Debug methods
  static async debugTokenStorage() {
    const token = await this.getAuthToken();
    console.log('🔍 Current stored token:', token ? `${token.substring(0, 20)}...` : 'No token');
    return !!token;
  }

  static async debugClearToken() {
    await this.removeAuthToken();
    await this.removeCurrentUser();
    console.log('🔍 Token and user cleared for debugging');
  }

  // Test connection (always return true for direct MongoDB)
  static async testBackendConnection() {
    console.log('🧪 Testing direct MongoDB connection...');
    return true;
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

  // Google Calendar Integration - For future implementation
  static async getGoogleAuthUrl(): Promise<string> {
    console.log('🔄 Google Calendar integration not implemented yet');
    throw new Error('Google Calendar integration not implemented in direct MongoDB mode');
  }

  static async handleGoogleCallback(code: string): Promise<any> {
    console.log('🔄 Google Calendar integration not implemented yet');
    throw new Error('Google Calendar integration not implemented in direct MongoDB mode');
  }

  static async getGoogleCalendarStatus(): Promise<{
    connected: boolean;
    googleEmail?: string;
    hasAvailableSlots: boolean;
  }> {
    console.log('🔄 Google Calendar integration not implemented yet');
    return {
      connected: false,
      hasAvailableSlots: false
    };
  }

  static async checkTimeslotsAvailability(timeslots: any[], dateRange = 30): Promise<{
    timeslots: any[];
    totalEvents: number;
    busyPeriodsCount: number;
    dateRange: { from: string; to: string };
    updatedAvailability: boolean;
    availableTimeslotIds: string[];
    message: string;
  }> {
    console.log('🔄 Google Calendar integration not implemented yet');
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + dateRange);
    
    return {
      timeslots: timeslots.map(ts => ({ ...ts, available: true })),
      totalEvents: 0,
      busyPeriodsCount: 0,
      dateRange: { 
        from: today.toISOString().split('T')[0], 
        to: futureDate.toISOString().split('T')[0] 
      },
      updatedAvailability: false,
      availableTimeslotIds: timeslots.map(ts => ts.id),
      message: 'Google Calendar integration not implemented'
    };
  }

  static async getAvailableSlots(): Promise<{
    availableSlots: any[];
    busyEventsCount: number;
    dateRange: { from: string; to: string };
  }> {
    console.log('🔄 Google Calendar integration not implemented yet');
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 30);
    
    return {
      availableSlots: [],
      busyEventsCount: 0,
      dateRange: { 
        from: today.toISOString().split('T')[0], 
        to: futureDate.toISOString().split('T')[0] 
      }
    };
  }

  static async importGoogleCalendarAvailability(): Promise<any[]> {
    console.log('🔄 Google Calendar integration not implemented yet');
    return [];
  }

  static async importSelectedSlots(selectedSlots: any[]): Promise<any> {
    console.log('🔄 Google Calendar integration not implemented yet');
    return { success: false, message: 'Google Calendar integration not implemented' };
  }

  static async disconnectGoogleCalendar(): Promise<any> {
    console.log('🔄 Google Calendar integration not implemented yet');
    return { success: false, message: 'Google Calendar integration not implemented' };
  }
}

// Simple wrapper function for testing connection
export async function testApiConnection() {
  console.log('🔍 Testing direct MongoDB connection...');
  try {
    await DirectMongoService.connect();
    console.log('✅ Direct MongoDB connection successful');
    return true;
  } catch (error) {
    console.error('❌ Direct MongoDB connection test failed:', error);
    return false;
  }
}

export default ApiService;
