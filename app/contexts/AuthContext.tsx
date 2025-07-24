import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import ApiService from '../services/api';
import { StorageService } from '../services/storage';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  availability: string[];
  scenes: string[];
  isActor: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingIn: boolean; // Add this line
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  googleLogin: (tokenOrCode: string, isCode?: boolean) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Initialize authentication state - check for existing cookie session
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔐 AuthContext: Initializing auth state - checking for existing session');
        
        // For development, check localStorage first as it's more reliable than cookies
        if (__DEV__) {
          try {
            const localToken = await StorageService.getItem('auth_token');
            if (localToken) {
              console.log('🔐 AuthContext: Found token in localStorage, validating...');
              const currentUser = await ApiService.getCurrentUser();
              if (currentUser && isMounted) {
                console.log('🔐 AuthContext: Valid session found for user:', currentUser.email);
                setUser(currentUser);
                return;
              } else {
                console.log('🔐 AuthContext: localStorage token invalid, clearing...');
                await StorageService.removeItem('auth_token');
              }
            }
          } catch {
            console.log('🔐 AuthContext: localStorage check failed, trying cookie auth...');
          }
        }
        
        // Fallback to cookie-based auth
        const currentUser = await ApiService.getCurrentUser();
        if (currentUser && isMounted) {
          console.log('🔐 AuthContext: Found existing session for user:', currentUser.email);
          setUser(currentUser);
        } else {
          console.log('🔐 AuthContext: No existing session found');
          setUser(null);
        }
      } catch (error) {
        console.log('🔐 AuthContext: No valid session found:', error);
        setUser(null);
      } finally {
        if (isMounted) {
          console.log('🔐 AuthContext: Auth initialization complete');
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
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
          availability: response.user.availability || [],
          scenes: response.user.scenes || []
        };
        
        console.log('🔐 AuthContext: Setting user data', userData);
        setUser(userData);
        setIsLoading(false);
        
        console.log('🔐 AuthContext: Login completed successfully');
        return { success: true };
      } else {
        console.log('🔐 AuthContext: No user or token in response, login failed');
        console.log('🔐 AuthContext: Response token:', !!response.token);
        console.log('🔐 AuthContext: Response user:', !!response.user);
        setUser(null);
        return { success: false, error: 'Login failed. Please check your credentials.' };
      }
    } catch (error) {
      console.error('🔐 AuthContext: Login error:', error);
      console.error('🔐 AuthContext: Error details:', {
        message: (error as any)?.message || 'Unknown error',
        stack: (error as any)?.stack || 'No stack trace',
        name: (error as any)?.name || 'Unknown error type'
      });
      
      // Extract error message from the API response
      const errorMessage = (error as any)?.message || 'An unexpected error occurred. Please try again.';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
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
          availability: response.user.availability || [],
          scenes: response.user.scenes || []
        };
        
        console.log('🔐 AuthContext: Setting user data', userData);
        setUser(userData);
        return { success: true };
      } else {
        console.log('🔐 AuthContext: No user in response');
        return { success: false, error: 'Registration failed. Please try again.' };
      }
    } catch (error) {
      console.error('🔐 AuthContext: Registration error:', error);
      
      // Extract error message from the API response
      const errorMessage = (error as any)?.message || 'Registration failed. Please try again.';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useCallback(async (tokenOrCode: string, isCode: boolean = false) => {
    console.log('🔐 🔍 DEBUGGING: AuthContext.googleLogin called with:', {
      hasTokenOrCode: !!tokenOrCode,
      tokenOrCodeLength: tokenOrCode?.length,
      isCode,
      timestamp: new Date().toISOString()
    });
    
    setIsLoggingIn(true); // Set loading state to true
    try {
      console.log('🔐 🔍 DEBUGGING: Calling ApiService.googleLogin...');
      const response = await ApiService.googleLogin(tokenOrCode, isCode);
      
      console.log('🔐 🔍 DEBUGGING: ApiService.googleLogin response received:', {
        hasToken: !!response.token,
        hasUser: !!response.user,
        userEmail: response.user?.email,
        userName: response.user?.name,
        tokenLength: response.token?.length
      });
      
      if (response.token && response.user) {
        console.log('🔐 🔍 DEBUGGING: Storing token and setting user state...');
        // Clear any existing tokens first to prevent conflicts
        await StorageService.removeItem('auth_token');
        // Set the new token
        await StorageService.setItem('auth_token', response.token);
        
        const userData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          phone: response.user.phone || '',
          isActor: response.user.isActor,
          isAdmin: response.user.isAdmin || false,
          availability: response.user.availability || [],
          scenes: response.user.scenes || []
        };
        
        console.log('🔐 🔍 DEBUGGING: Setting user state with:', {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          isActor: userData.isActor,
          isAdmin: userData.isAdmin
        });
        
        setUser(userData);
        console.log('🔐 🔍 DEBUGGING: ✅ Google login successful!');
        return true;
      } else {
        console.log('🔐 🔍 DEBUGGING: ❌ Missing token or user in response');
        return false;
      }
    } catch (error) {
      console.error('🔐 🔍 DEBUGGING: ❌ Google login error in AuthContext:', {
        message: (error as any)?.message,
        status: (error as any)?.status,
        stack: (error as any)?.stack?.substring(0, 300)
      });
      return false;
    } finally {
      setIsLoggingIn(false); // Set loading state to false
    }
  }, []);

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

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<void> => {
    if (!user) return;

    try {
      const response = await ApiService.updateProfile(updates);
      console.log('🔐 AuthContext: updateProfile response:', response);
      
      // The API returns { message, user }, so we need to extract the user object
      const updatedUserData = response.user || response;
      console.log('🔐 AuthContext: updating user state with:', updatedUserData);
      
      setUser(updatedUserData);
    } catch (error) {
      console.error('Error updating profile in AuthContext:', error);
      throw error;
    }
  }, [user]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      console.log('🔄 AuthContext: Refreshing user data from server...');
      const userData = await ApiService.getCurrentUser();
      console.log('🔄 AuthContext: Refreshed user data:', userData);
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user in AuthContext:', error);
      throw error;
    }
  }, []);

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
      availability: [],
      scenes: []
    };
    setUser(guestUser);
    setIsLoading(false);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggingIn, // Add this line
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    forceLogout,
    skipLogin,
    googleLogin // Add this line
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
