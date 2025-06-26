import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import ApiService from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  availableTimeslots: string[];
  scenes: string[];
  isActor: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setUserAsActor: (availableTimeslots: string[], scenes: string[]) => Promise<void>;
  forceLogout: () => void;
  skipLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadUser = useCallback(async () => {
    if (hasInitialized) {
      console.log('loadUser already called, skipping');
      return;
    }

    try {
      setHasInitialized(true);
      console.log('Loading user session...');
      
      // First check if we have a token before making the API call
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        // No token stored, user is not logged in
        console.log('No auth token found, user not logged in');
        return;
      }

      console.log('Token found, validating session...');
      // Check if there's a stored token and try to get current user
      const currentUser = await ApiService.getCurrentUser();
      if (currentUser) {
        console.log('Session valid, user logged in:', currentUser.email);
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          phone: currentUser.phone || '',
          isActor: currentUser.isActor,
          availableTimeslots: currentUser.availableTimeslots || [],
          scenes: currentUser.scenes || []
        });
      }
    } catch (error) {
      console.log('Session validation failed:', error);
      // Clear any invalid token silently
      await ApiService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [hasInitialized]);

  useEffect(() => {
    if (!hasInitialized) {
      loadUser();
    }
  }, [hasInitialized, loadUser]);

  useEffect(() => {
    console.log('AuthProvider - user state changed:', user ? `logged in as ${user.email}` : 'logged out');
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Starting login for', email);
      setIsLoading(true);
      const response = await ApiService.login({ email, password });
      
      console.log('🔐 AuthContext: Login response received', { 
        hasToken: !!response.token, 
        hasUser: !!response.user,
        userEmail: response.user?.email 
      });
      
      if (response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          phone: response.user.phone || '',
          isActor: response.user.isActor,
          availableTimeslots: response.user.availableTimeslots || [],
          scenes: response.user.scenes || []
        };
        
        console.log('🔐 AuthContext: Setting user data', userData);
        setUser(userData);
        return true;
      } else {
        console.log('🔐 AuthContext: No user in response');
        return false;
      }
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Starting registration for', email);
      setIsLoading(true);
      const response = await ApiService.register({ email, password, name });
      
      console.log('🔐 AuthContext: Registration response received', { 
        hasToken: !!response.token, 
        hasUser: !!response.user,
        userEmail: response.user?.email 
      });
      
      if (response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          phone: response.user.phone || '',
          isActor: response.user.isActor,
          availableTimeslots: response.user.availableTimeslots || [],
          scenes: response.user.scenes || []
        };
        
        console.log('🔐 AuthContext: Setting user data', userData);
        setUser(userData);
        return true;
      } else {
        console.log('🔐 AuthContext: No user in response');
        return false;
      }
    } catch (error) {
      console.error('🔐 AuthContext: Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    console.log('Logout called');
    ApiService.logout();
    setUser(null);
  }, []);

  const forceLogout = useCallback(() => {
    console.log('Force logout called');
    ApiService.logout();
    setUser(null);
  }, []);

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      const updatedUser = await ApiService.updateProfile({
        name: updates.name || user.name,
        phone: updates.phone || user.phone,
        isActor: updates.isActor !== undefined ? updates.isActor : user.isActor,
        availableTimeslots: updates.availableTimeslots || user.availableTimeslots,
        scenes: updates.scenes || user.scenes
      });

      setUser({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone || '',
        isActor: updatedUser.isActor,
        availableTimeslots: updatedUser.availableTimeslots || [],
        scenes: updatedUser.scenes || []
      });
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const setUserAsActor = async (availableTimeslots: string[], scenes: string[]): Promise<void> => {
    await updateProfile({
      isActor: true,
      availableTimeslots,
      scenes
    });
  };

  const skipLogin = useCallback(() => {
    console.log('🔐 Skip login called - creating guest user');
    // Create a temporary guest user that allows app usage without authentication
    const guestUser: User = {
      id: 'guest',
      email: 'guest@local',
      name: 'Guest User',
      phone: '',
      isActor: false,
      availableTimeslots: [],
      scenes: []
    };
    setUser(guestUser);
    setIsLoading(false);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    setUserAsActor,
    forceLogout,
    skipLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
