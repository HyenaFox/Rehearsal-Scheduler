// Hybrid storage service that can work with both AsyncStorage and Firebase
// This allows gradual migration from local to cloud storage

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types';

// For now, we'll extend your existing storage service with Firebase capabilities
// Once Firebase is properly set up, we can gradually migrate functions

export class HybridStorageService {
  static firebaseEnabled = false; // Set to true once Firebase is configured
  
  // User authentication - will use Firebase when available
  static async signUp(email, password, username, displayName) {
    if (this.firebaseEnabled) {
      // TODO: Implement Firebase auth
      return { success: false, error: 'Firebase not yet configured' };
    }
    
    // Fallback to current AsyncStorage method
    try {
      const existingUsers = await this.loadUsers();
      const userExists = existingUsers.some(u => 
        u.username.toLowerCase() === username.toLowerCase() || 
        u.email === email
      );
      
      if (userExists) {
        return { success: false, error: 'User already exists' };
      }

      const newUser = {
        id: Date.now().toString(),
        username: username.toLowerCase().trim(),
        displayName: displayName.trim(),
        email: email.toLowerCase().trim(),
        isAdmin: existingUsers.length === 0,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...existingUsers, newUser];
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async signIn(email, password) {
    if (this.firebaseEnabled) {
      // TODO: Implement Firebase auth
      return { success: false, error: 'Firebase not yet configured' };
    }
    
    // Fallback to username-based login for now
    try {
      const users = await this.loadUsers();
      const user = users.find(u => 
        u.email === email.toLowerCase() || 
        u.username === email.toLowerCase()
      );
      
      if (user) {
        // Save current user
        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        return { success: true, user };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  static async signOut() {
    if (this.firebaseEnabled) {
      // TODO: Implement Firebase signout
    }
    
    // Clear current user from AsyncStorage
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Data management methods
  static async loadUsers() {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }
  
  static async getCurrentUser() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error loading current user:', error);
      return null;
    }
  }
  
  static async getUserProfile(userId) {
    try {
      const key = `${STORAGE_KEYS.USER_PROFILES}_${userId}`;
      const profileData = await AsyncStorage.getItem(key);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  }
  
  static async saveUserProfile(userId, profile) {
    try {
      const key = `${STORAGE_KEYS.USER_PROFILES}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        ...profile,
        updatedAt: new Date().toISOString()
      }));
      return { success: true };
    } catch (error) {
      console.error('Error saving user profile:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Rehearsal management
  static async loadRehearsals() {
    try {
      const rehearsalsData = await AsyncStorage.getItem(STORAGE_KEYS.REHEARSALS);
      return rehearsalsData ? JSON.parse(rehearsalsData) : [];
    } catch (error) {
      console.error('Error loading rehearsals:', error);
      return [];
    }
  }
  
  static async saveRehearsals(rehearsals) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REHEARSALS, JSON.stringify(rehearsals));
      return { success: true };
    } catch (error) {
      console.error('Error saving rehearsals:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Scene and timeslot management
  static async loadScenes() {
    try {
      const scenesData = await AsyncStorage.getItem(STORAGE_KEYS.SCENES);
      return scenesData ? JSON.parse(scenesData) : [];
    } catch (error) {
      console.error('Error loading scenes:', error);
      return [];
    }
  }
  
  static async saveScenes(scenes) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(scenes));
      return { success: true };
    } catch (error) {
      console.error('Error saving scenes:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async loadTimeslots() {
    try {
      const timeslotsData = await AsyncStorage.getItem(STORAGE_KEYS.TIMESLOTS);
      return timeslotsData ? JSON.parse(timeslotsData) : [];
    } catch (error) {
      console.error('Error loading timeslots:', error);
      return [];
    }
  }
  
  static async saveTimeslots(timeslots) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TIMESLOTS, JSON.stringify(timeslots));
      return { success: true };
    } catch (error) {
      console.error('Error saving timeslots:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Migration helper - export all data for Firebase migration
  static async exportAllData() {
    try {
      const [users, rehearsals, scenes, timeslots] = await Promise.all([
        this.loadUsers(),
        this.loadRehearsals(),
        this.loadScenes(),
        this.loadTimeslots()
      ]);
      
      // Get all user profiles
      const userProfiles = {};
      for (const user of users) {
        const profile = await this.getUserProfile(user.id);
        if (profile) {
          userProfiles[user.id] = profile;
        }
      }
      
      return {
        users,
        userProfiles,
        rehearsals,
        scenes,
        timeslots,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }
}
