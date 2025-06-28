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
  const [isLoading, setIsLoading] = useState(false); // Start with false - let individual screens handle their loading
  const [hasInitialized, setHasInitialized] = useState(false);

  // Force immediate initialization for web - only run once on mount
  useEffect(() => {
    console.log('🚀 AuthProvider - FORCED IMMEDIATE INITIALIZATION');
    console.log('🚀 Current state:', { user, isLoading, hasInitialized });
    
    // Force loading to false immediately for web
    if (typeof window !== 'undefined') {
      console.log('🌐 Web environment detected - setting loading to false immediately');
      setIsLoading(false);
      setHasInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Backup initialization attempt - only run when hasInitialized changes
  useEffect(() => {
    console.log('AuthProvider - Backup initialization attempt...');
    console.log('AuthProvider - hasInitialized:', hasInitialized);
    console.log('AuthProvider - isLoading:', isLoading);
    console.log('AuthProvider - user:', user);
    
    if (!hasInitialized) {
      console.log('AuthProvider - Running backup initialization...');
      const timer = setTimeout(() => {
        console.log('AuthProvider - Timer-based initialization');
        setHasInitialized(true);
        setIsLoading(false);
        
        // Try to load user if there's a token, but don't block the UI
        AsyncStorage.getItem('auth_token').then(token => {
          if (token) {
            console.log('Found token during backup init, attempting to validate user');
            ApiService.getCurrentUser().then(currentUser => {
              if (currentUser) {
                console.log('Setting user from backup init:', currentUser.email);
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
              }
            }).catch(err => {
              console.log('Backup init user validation failed:', err);
              AsyncStorage.removeItem('auth_token');
            });
          }
        }).catch(err => {
          console.log('Backup init token check failed:', err);
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized]); // Only depend on hasInitialized to avoid loops

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
