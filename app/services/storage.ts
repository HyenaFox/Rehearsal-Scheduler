import AsyncStorage from '@react-native-async-storage/async-storage';

// Cross-platform storage service that works reliably on web and native
class StorageService {
  private static isWeb = typeof window !== 'undefined';

  static async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb) {
        // On web, try localStorage first, fall back to AsyncStorage
        try {
          const item = localStorage.getItem(key);
          console.log(`📦 StorageService.getItem(${key}) from localStorage:`, item ? 'found' : 'not found');
          return item;
        } catch (localStorageError) {
          console.log(`📦 localStorage failed for ${key}, falling back to AsyncStorage:`, localStorageError);
          const item = await AsyncStorage.getItem(key);
          console.log(`📦 StorageService.getItem(${key}) from AsyncStorage fallback:`, item ? 'found' : 'not found');
          return item;
        }
      } else {
        // On native, use AsyncStorage
        const item = await AsyncStorage.getItem(key);
        console.log(`📦 StorageService.getItem(${key}) from AsyncStorage:`, item ? 'found' : 'not found');
        return item;
      }
    } catch (error) {
      console.error(`📦 StorageService.getItem(${key}) error:`, error);
      return null;
    }
  }

  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb) {
        // On web, use both localStorage and AsyncStorage for redundancy
        try {
          localStorage.setItem(key, value);
          console.log(`📦 StorageService.setItem(${key}) to localStorage: success`);
        } catch (localStorageError) {
          console.log(`📦 localStorage setItem failed for ${key}:`, localStorageError);
        }
        
        try {
          await AsyncStorage.setItem(key, value);
          console.log(`📦 StorageService.setItem(${key}) to AsyncStorage: success`);
        } catch (asyncStorageError) {
          console.log(`📦 AsyncStorage setItem failed for ${key}:`, asyncStorageError);
        }
      } else {
        // On native, use AsyncStorage
        await AsyncStorage.setItem(key, value);
        console.log(`📦 StorageService.setItem(${key}) to AsyncStorage: success`);
      }
    } catch (error) {
      console.error(`📦 StorageService.setItem(${key}) error:`, error);
      throw error;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb) {
        // On web, remove from both localStorage and AsyncStorage
        try {
          localStorage.removeItem(key);
          console.log(`📦 StorageService.removeItem(${key}) from localStorage: success`);
        } catch (localStorageError) {
          console.log(`📦 localStorage removeItem failed for ${key}:`, localStorageError);
        }
        
        try {
          await AsyncStorage.removeItem(key);
          console.log(`📦 StorageService.removeItem(${key}) from AsyncStorage: success`);
        } catch (asyncStorageError) {
          console.log(`📦 AsyncStorage removeItem failed for ${key}:`, asyncStorageError);
        }
      } else {
        // On native, use AsyncStorage
        await AsyncStorage.removeItem(key);
        console.log(`📦 StorageService.removeItem(${key}) from AsyncStorage: success`);
      }
    } catch (error) {
      console.error(`📦 StorageService.removeItem(${key}) error:`, error);
      throw error;
    }
  }

  // Helper method to clear all auth-related data
  static async clearAuthData(): Promise<void> {
    const authKeys = ['auth_token', 'user_data'];
    for (const key of authKeys) {
      await this.removeItem(key);
    }
    console.log('📦 StorageService: All auth data cleared');
  }
}

export { StorageService };
export default StorageService;
