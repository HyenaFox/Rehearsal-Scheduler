import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types';

// Storage service functions
export const StorageService = {
  // Save data to AsyncStorage
  saveData: async (key, data) => {
    try {
      const jsonData = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonData);
      console.log(`Saved ${key} to storage`);
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
        console.log(`Loaded ${key} from storage`);
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
      console.log('Cleared all storage');
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
  },
};
