import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types';

// Storage service functions
export const StorageService = {  // Save data to AsyncStorage
  saveData: async (key, data) => {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  },

  // Load data from AsyncStorage
  loadData: async (key, defaultValue = []) => {
    try {
      const jsonData = await AsyncStorage.getItem(key);
      if (jsonData !== null) {
        const data = JSON.parse(jsonData);
        return data;
      }
      return defaultValue;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return defaultValue;
    }
  },

  // Clear all storage (for development/testing)
  clearAll: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },

  // Save actors
  saveActors: async (actors) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTORS, JSON.stringify(actors));
  },

  // Load actors
  loadActors: async () => {
    const actorsData = await AsyncStorage.getItem(STORAGE_KEYS.ACTORS);
    return actorsData ? JSON.parse(actorsData) : [];
  },

  // Save rehearsals
  saveRehearsals: async (rehearsals) => {
    await AsyncStorage.setItem(STORAGE_KEYS.REHEARSALS, JSON.stringify(rehearsals));
  },

  // Load rehearsals
  loadRehearsals: async () => {
    const rehearsalsData = await AsyncStorage.getItem(STORAGE_KEYS.REHEARSALS);
    return rehearsalsData ? JSON.parse(rehearsalsData) : [];
  },

  // Save timeslots
  saveTimeslots: async (timeslots) => {
    await AsyncStorage.setItem(STORAGE_KEYS.TIMESLOTS, JSON.stringify(timeslots));
  },

  // Load timeslots
  loadTimeslots: async () => {
    const timeslotsData = await AsyncStorage.getItem(STORAGE_KEYS.TIMESLOTS);
    return timeslotsData ? JSON.parse(timeslotsData) : [];
  },

  // Save scenes
  saveScenes: async (scenes) => {
    await AsyncStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(scenes));
  },
  // Load scenes
  loadScenes: async () => {
    const scenesData = await AsyncStorage.getItem(STORAGE_KEYS.SCENES);
    return scenesData ? JSON.parse(scenesData) : [];
  },  // User-related storage methods
  saveUsers: async (users) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      console.error('Storage: Error saving users:', error);
      throw error;
    }
  },

  loadUsers: async () => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : [];
      return users;
    } catch (error) {
      console.error('Storage: Error loading users:', error);
      return [];
    }
  },

  saveCurrentUser: async (user) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (error) {
      console.error('Storage: Error saving current user:', error);
      throw error;
    }
  },

  loadCurrentUser: async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const user = userData ? JSON.parse(userData) : null;
      return user;
    } catch (error) {
      console.error('Storage: Error loading current user:', error);
      return null;
    }
  },

  clearCurrentUser: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      console.error('Storage: Error clearing current user:', error);
      throw error;
    }
  },

  // User profile methods
  saveUserProfile: async (userId, profile) => {
    const key = `${STORAGE_KEYS.USER_PROFILES}_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(profile));
  },

  loadUserProfile: async (userId) => {
    const key = `${STORAGE_KEYS.USER_PROFILES}_${userId}`;
    const profileData = await AsyncStorage.getItem(key);
    return profileData ? JSON.parse(profileData) : null;
  },

  // Admin/Master data (only accessible to admin users)
  saveMasterActors: async (actors) => {
    await AsyncStorage.setItem(STORAGE_KEYS.MASTER_ACTORS, JSON.stringify(actors));
  },

  loadMasterActors: async () => {
    const actorsData = await AsyncStorage.getItem(STORAGE_KEYS.MASTER_ACTORS);
    return actorsData ? JSON.parse(actorsData) : [];
  },
};
