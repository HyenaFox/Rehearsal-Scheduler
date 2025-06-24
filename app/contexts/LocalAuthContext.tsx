import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

interface UserProfile {
  userId: string;
  displayName: string;
  availableTimeslots: string[];
  scenes: string[];
  contactInfo?: string;
  notes?: string;
  updatedAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  users: User[];
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'local_users',
  USER_PROFILES: 'local_user_profiles',
  CURRENT_USER: 'local_current_user',
  USER_CREDENTIALS: 'local_user_credentials'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load current user and users on startup
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load current user
        const currentUserData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (currentUserData) {
          const user = JSON.parse(currentUserData);
          setCurrentUser(user);
          
          // Load user profile
          const profilesData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILES);
          if (profilesData) {
            const profiles = JSON.parse(profilesData);
            const userProfile = profiles[user.id];
            if (userProfile) {
              setUserProfile(userProfile);
            }
          }
        }
        
        // Load all users
        await refreshUsers();
        
        // Create default admin if no users exist
        await createDefaultAdminIfNeeded();
        
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const createDefaultAdminIfNeeded = async () => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : [];
      
      if (users.length === 0) {
        console.log('Creating default admin user...');
        
        const adminUser: User = {
          id: 'admin-' + Date.now(),
          username: 'admin',
          displayName: 'Administrator',
          email: 'admin@rehearsal.com',
          isAdmin: true,
          createdAt: new Date().toISOString()
        };

        const adminProfile: UserProfile = {
          userId: adminUser.id,
          displayName: 'Administrator',
          availableTimeslots: [],
          scenes: [],
          contactInfo: '',
          notes: 'Default admin account',
          updatedAt: new Date().toISOString()
        };

        // Save admin user
        await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([adminUser]));
        
        // Save admin profile
        const profiles = { [adminUser.id]: adminProfile };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(profiles));
        
        // Save admin credentials
        const credentials = { [adminUser.id]: { email: adminUser.email, password: 'admin123' } };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify(credentials));
        
        console.log('Default admin created successfully');
        await refreshUsers();
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  };

  const login = async (emailOrUsername: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log('Local login attempt for:', emailOrUsername);
      
      // Load users and credentials
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const credentialsData = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
      
      if (!usersData || !credentialsData) {
        return { success: false, message: 'No users found' };
      }
      
      const users: User[] = JSON.parse(usersData);
      const credentials = JSON.parse(credentialsData);
      
      // Find user by email or username
      let user: User | undefined;
      if (emailOrUsername.includes('@')) {
        user = users.find(u => u.email.toLowerCase() === emailOrUsername.toLowerCase());
      } else {
        user = users.find(u => u.username.toLowerCase() === emailOrUsername.toLowerCase());
      }
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      // Check password
      const userCredentials = credentials[user.id];
      if (!userCredentials || userCredentials.password !== password) {
        return { success: false, message: 'Invalid password' };
      }
      
      // Login successful
      setCurrentUser(user);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      
      // Load user profile
      const profilesData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILES);
      if (profilesData) {
        const profiles = JSON.parse(profilesData);
        const userProfile = profiles[user.id];
        if (userProfile) {
          setUserProfile(userProfile);
        }
      }
      
      console.log('Login successful for:', user.username);
      return { success: true };
      
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed: ' + (error instanceof Error ? error.message : 'Unknown error') };
    }
  };

  const signUp = async (email: string, password: string, username: string, displayName: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      
      // Load existing users
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const credentialsData = await AsyncStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
      
      const existingUsers: User[] = usersData ? JSON.parse(usersData) : [];
      const existingCredentials = credentialsData ? JSON.parse(credentialsData) : {};
      
      // Check if username or email already exists
      const userExists = existingUsers.find(u => 
        u.username.toLowerCase() === username.toLowerCase() || 
        u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (userExists) {
        return { success: false, message: 'Username or email already exists' };
      }
      
      // Create new user
      const newUser: User = {
        id: 'user-' + Date.now(),
        username: username.toLowerCase(),
        displayName,
        email: email.toLowerCase(),
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      
      // Create user profile
      const newProfile: UserProfile = {
        userId: newUser.id,
        displayName,
        availableTimeslots: [],
        scenes: [],
        contactInfo: '',
        notes: '',
        updatedAt: new Date().toISOString()
      };
      
      // Save user
      const updatedUsers = [...existingUsers, newUser];
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      
      // Save credentials
      const updatedCredentials = { ...existingCredentials, [newUser.id]: { email, password } };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify(updatedCredentials));
      
      // Save profile
      const profilesData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILES);
      const existingProfiles = profilesData ? JSON.parse(profilesData) : {};
      const updatedProfiles = { ...existingProfiles, [newUser.id]: newProfile };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(updatedProfiles));
      
      // Auto-login the new user
      setCurrentUser(newUser);
      setUserProfile(newProfile);
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
      
      await refreshUsers();
      
      console.log('Sign up successful for:', newUser.username);
      return { success: true };
      
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, message: 'Sign up failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setCurrentUser(null);
      setUserProfile(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = async (profileUpdates: Partial<UserProfile>): Promise<void> => {
    if (!currentUser || !userProfile) return;
    
    try {
      const updatedProfile = {
        ...userProfile,
        ...profileUpdates,
        updatedAt: new Date().toISOString()
      };
      
      // Load existing profiles
      const profilesData = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILES);
      const existingProfiles = profilesData ? JSON.parse(profilesData) : {};
      
      // Update profile
      const updatedProfiles = { ...existingProfiles, [currentUser.id]: updatedProfile };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(updatedProfiles));
      
      setUserProfile(updatedProfile);
      console.log('Profile updated for:', currentUser.username);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const refreshUsers = async (): Promise<void> => {
    try {
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
      const users = usersData ? JSON.parse(usersData) : [];
      setUsers(users);
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    users,
    isLoading,
    login,
    signUp,
    logout,
    updateUserProfile,
    refreshUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
