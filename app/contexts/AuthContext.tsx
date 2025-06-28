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
  isAdmin: boolean;
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
  const [isLoading, setIsLoading] = useState(false); // Start with false to prevent infinite loading
  const [hasInitialized, setHasInitialized] = useState(false);

  // Web failsafe - immediately set loading to false on web platform
  useEffect(() => {
    const platform = typeof window !== 'undefined' ? 'web' : 'native';
    console.log('AuthProvider - Platform detected:', platform);
    
    if (platform === 'web') {
      // Add a small delay to allow for proper rendering, then ensure loading is false
      const webFailsafe = setTimeout(() => {
        console.log('🌐 Web failsafe triggered - ensuring loading state is cleared');
        setIsLoading(false);
        if (!hasInitialized) {
          setHasInitialized(true);
        }
      }, 1000); // 1 second failsafe
      
      return () => clearTimeout(webFailsafe);
    }
  }, [hasInitialized]);

  const loadUser = useCallback(async () => {
    console.log('=== loadUser called ===');
    console.log('hasInitialized:', hasInitialized);
    
    if (hasInitialized) {
      console.log('loadUser already called, skipping');
      return;
    }

    setHasInitialized(true);
    setIsLoading(true); // Only set loading to true when we actually start
    console.log('Loading user session...');

    try {
      // Much shorter timeout for web to prevent blocking
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Auth initialization timeout - setting user to null and completing');
        setUser(null);
        setIsLoading(false);
      }, 2000); // 2 second timeout

      // Check for stored token
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        console.log('No auth token found, user not logged in');
        clearTimeout(timeoutId);
        setUser(null);
        setIsLoading(false);
        return;
      }

      console.log('Token found, attempting quick validation...');
      
      try {
        const currentUser = await ApiService.getCurrentUser();
        clearTimeout(timeoutId);
        
        if (currentUser) {
          console.log('Session valid, user logged in:', currentUser.email);
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            phone: currentUser.phone || '',
            isActor: currentUser.isActor,
            isAdmin: currentUser.isAdmin || false,
            availableTimeslots: currentUser.availableTimeslots || [],
            scenes: currentUser.scenes || []
          });
        } else {
          console.log('Session validation returned no user');
          setUser(null);
          await AsyncStorage.removeItem('auth_token');
        }
        console.log('Setting isLoading to false after success');
        setIsLoading(false);
      } catch (apiError) {
        clearTimeout(timeoutId);
        console.log('Session validation failed, clearing token and continuing:', apiError);
        await AsyncStorage.removeItem('auth_token');
        setUser(null);
        console.log('Setting isLoading to false after API error');
        setIsLoading(false);
      }
    } catch (error) {
      console.log('Auth initialization error:', error);
      setUser(null);
      console.log('Setting isLoading to false after general error');
      setIsLoading(false);
    }
  }, [hasInitialized]);

  useEffect(() => {
    if (!hasInitialized) {
      loadUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized]); // Removed loadUser from dependencies to prevent circular dependency

  useEffect(() => {
    console.log('AuthProvider - user state changed:', user ? `logged in as ${user.email}` : 'logged out');
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Starting login for', email);
      console.log('🔐 AuthContext: Current user state before login:', user);
      setIsLoading(true);
      
      console.log('🔐 AuthContext: Calling ApiService.login...');
      const response = await ApiService.login({ email, password });
      
      console.log('🔐 AuthContext: Login response received', { 
        hasToken: !!response.token, 
        hasUser: !!response.user,
        userEmail: response.user?.email,
        fullResponse: response
      });
      
      if (response.user) {
        const userData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          phone: response.user.phone || '',
          isActor: response.user.isActor,
          isAdmin: response.user.isAdmin || false,
          availableTimeslots: response.user.availableTimeslots || [],
          scenes: response.user.scenes || []
        };
        
        console.log('🔐 AuthContext: Setting user data and login successful', userData);
        setUser(userData);
        console.log('🔐 AuthContext: User state after setUser:', userData);
        return true;
      } else {
        console.log('🔐 AuthContext: No user in response, login failed');
        console.log('🔐 AuthContext: Full response object:', response);
        return false;
      }
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error);
      console.error('🔐 AuthContext: Error details:', {
        message: (error as any)?.message || 'Unknown error',
        stack: (error as any)?.stack || 'No stack trace',
        name: (error as any)?.name || 'Unknown error type'
      });
      return false;
    } finally {
      console.log('🔐 AuthContext: Login process completed, setting loading to false');
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
          isAdmin: response.user.isAdmin || false,
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
        isAdmin: updatedUser.isAdmin || false,
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
      isAdmin: false,
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
