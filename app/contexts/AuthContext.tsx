import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import ApiService from '../services/api';
import { StorageService } from '../services/storage';

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
  const [isLoading, setIsLoading] = useState(true); // Start with true - we need to check for existing auth
  const [initializationAttempted, setInitializationAttempted] = useState(false);

  // Initialize authentication state - check for existing tokens
  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initializationAttempted) {
      console.log('🚀 AuthProvider - Initialization already attempted, skipping...');
      return;
    }

    let isMounted = true;
    
    const initializeAuth = async () => {
      console.log('🚀 AuthProvider - Starting initialization...');
      setInitializationAttempted(true);
      
      try {
        // Check if we have a stored token
        const token = await StorageService.getItem('auth_token');
        
        if (token) {
          console.log('🔑 Found existing auth token, validating user...');
          
          try {
            // Validate the token by getting current user
            const currentUser = await ApiService.getCurrentUser();
            
            if (currentUser && isMounted) {
              console.log('✅ Token valid, restoring user session:', currentUser.email);
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
            } else if (isMounted) {
              console.log('❌ Token invalid or no user returned, removing token...');
              await StorageService.removeItem('auth_token');
            }
          } catch (error) {
            console.log('❌ Token validation failed:', error);
            if (isMounted) {
              console.log('🧹 Cleaning up invalid token...');
              await StorageService.removeItem('auth_token');
            }
          }
        } else {
          console.log('🔍 No existing auth token found');
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        // Clear any potentially corrupted auth data
        if (isMounted) {
          try {
            await StorageService.clearAuthData();
          } catch (clearError) {
            console.error('❌ Failed to clear auth data:', clearError);
          }
        }
      } finally {
        if (isMounted) {
          console.log('✅ Auth initialization complete');
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, [initializationAttempted]); // Include the dependency

  useEffect(() => {
    console.log('AuthProvider - user state changed:', user ? `logged in as ${user.email}` : 'logged out');
    if (user) {
      console.log('AuthProvider - user object details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        isActor: user.isActor,
        isAdmin: user.isAdmin
      });
    }
  }, [user]);

  useEffect(() => {
    console.log('AuthProvider - isLoading state changed:', isLoading);
  }, [isLoading]);

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
      
      if (response.user && response.token) {
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
        setIsLoading(false);
        
        console.log('🔐 AuthContext: Login completed successfully');
        return true;
      } else {
        console.log('🔐 AuthContext: No user or token in response, login failed');
        console.log('🔐 AuthContext: Response token:', !!response.token);
        console.log('🔐 AuthContext: Response user:', !!response.user);
        setUser(null);
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
