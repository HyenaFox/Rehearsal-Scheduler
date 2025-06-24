import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  availableTimeslots: string[];
  scenes: string[];
  isActor: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setUserAsActor: (availableTimeslots: string[], scenes: string[]) => Promise<void>;
  forceLogout: () => void; // Emergency logout function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const STORAGE_KEYS = {
  USER: '@rehearsal_scheduler_user',
  USERS_DB: '@rehearsal_scheduler_users_db',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render key

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    console.log('AuthProvider - user state changed:', user ? `logged in as ${user.email}` : 'logged out');
  }, [user]);

  useEffect(() => {
    console.log('AuthProvider - isLoading state changed:', isLoading);
  }, [isLoading]);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const getUsersDatabase = async (): Promise<Record<string, { password: string; user: User }>> => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      return usersData ? JSON.parse(usersData) : {};
    } catch (error) {
      console.error('Error loading users database:', error);
      return {};
    }
  };

  const saveUsersDatabase = async (usersDb: Record<string, { password: string; user: User }>) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(usersDb));
    } catch (error) {
      console.error('Error saving users database:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const usersDb = await getUsersDatabase();
      const userRecord = usersDb[email];
      
      if (userRecord && userRecord.password === password) {
        await saveUser(userRecord.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const usersDb = await getUsersDatabase();
      
      // Check if user already exists
      if (usersDb[email]) {
        return false;
      }

      const newUser: User = {
        id: Date.now().toString(),
        email,
        name,
        availableTimeslots: [],
        scenes: [],
        isActor: false,
        createdAt: new Date().toISOString(),
      };

      usersDb[email] = { password, user: newUser };
      await saveUsersDatabase(usersDb);
      await saveUser(newUser);
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = useCallback(async () => {
    try {
      console.log('Logout started...');
      // Immediately set user to null (like forceLogout)
      setUser(null);
      setRefreshKey(prev => prev + 1); // Force re-render
      setIsLoading(false);
      console.log('User state set to null immediately');
      
      // Clear storage in background (don't wait for it)
      AsyncStorage.removeItem(STORAGE_KEYS.USER).catch(console.error);
      console.log('Storage cleanup initiated in background');
      
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
      throw error; // Re-throw to be caught by the calling function
    }
  }, []);

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      
      // Update in users database
      const usersDb = await getUsersDatabase();
      if (usersDb[user.email]) {
        usersDb[user.email].user = updatedUser;
        await saveUsersDatabase(usersDb);
      }
      
      await saveUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const setUserAsActor = async (availableTimeslots: string[], scenes: string[]) => {
    if (!user) return;

    await updateProfile({
      isActor: true,
      availableTimeslots,
      scenes,
    });
  };

  const forceLogout = useCallback(() => {
    console.log('Force logout called - immediately setting user to null');
    setUser(null);
    setRefreshKey(prev => prev + 1);
    setIsLoading(false);
    // Also clear storage in background
    AsyncStorage.removeItem(STORAGE_KEYS.USER).catch(console.error);
  }, []);

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    setUserAsActor,
    forceLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
