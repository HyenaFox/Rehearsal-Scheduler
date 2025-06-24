import React, { createContext, useContext, useEffect, useState } from 'react';
import { StorageService } from '../services/storage';

interface User {
  id: string;
  username: string;
  displayName: string;
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
  login: (username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addNewUser: (username: string, displayName: string) => Promise<boolean>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);  useEffect(() => {
    const createDefaultAdmin = async () => {
      try {
        const defaultUser = {
          id: 'admin-' + Date.now(),
          username: 'admin',
          displayName: 'Administrator',
          isAdmin: true,
          createdAt: new Date().toISOString(),
        };

        const defaultProfile = {
          userId: defaultUser.id,
          displayName: 'Administrator',
          availableTimeslots: ['mon-2pm-4pm', 'wed-10am-1pm'], // Some default availability
          scenes: ['Act I, Scene 1'],
          contactInfo: '',
          notes: 'Default admin user for testing',
          updatedAt: new Date().toISOString(),
        };        await StorageService.saveUsers([defaultUser]);
        await StorageService.saveUserProfile(defaultUser.id, defaultProfile);
        
        await refreshUsers();
      } catch (error) {
        console.error('Error creating default admin:', error);
      }
    };    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Load current user
        const savedUser = await StorageService.loadCurrentUser();
        if (savedUser) {
          setCurrentUser(savedUser);
          
          // Load user profile
          const profile = await StorageService.loadUserProfile(savedUser.id);
          setUserProfile(profile);
        }
        
        // Load all users
        await refreshUsers();
        
        // Check if we need to create a default admin user (for testing)
        const allUsers = await StorageService.loadUsers();
        
        if (allUsers.length === 0) {
          await createDefaultAdmin();
        }
      } catch (error) {
        console.error('Error loading initial auth data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const refreshUsers = async () => {
    try {
      const allUsers = await StorageService.loadUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  };  const login = async (username: string): Promise<boolean> => {    try {
      const allUsers = await StorageService.loadUsers();
      const user = allUsers.find((u: User) => u.username.toLowerCase() === username.toLowerCase());
      
      if (user) {
        setCurrentUser(user);
        await StorageService.saveCurrentUser(user);
        
        // Load user profile
        const profile = await StorageService.loadUserProfile(user.id);
        setUserProfile(profile);
        
        return true;
      }
      
      // If username is 'admin' and no admin exists, create one
      if (username.toLowerCase() === 'admin' && allUsers.length === 0) {
        const success = await addNewUser('admin', 'Administrator');
        return success;
      }
      
      return false;
    } catch (error) {
      console.error('AuthContext: Error during login:', error);
      return false;
    }
  };
  const logout = async () => {
    try {
      // Clear current user from storage
      await StorageService.clearCurrentUser();
      
      // Clear state
      setCurrentUser(null);
      setUserProfile(null);
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  const addNewUser = async (username: string, displayName: string): Promise<boolean> => {
    try {
      // Check if username already exists
      const existingUsers = await StorageService.loadUsers();
      const userExists = existingUsers.some((u: User) => u.username.toLowerCase() === username.toLowerCase());
      
      if (userExists) {
        return false;
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        username: username.toLowerCase().trim(),
        displayName: displayName.trim(),
        isAdmin: existingUsers.length === 0, // First user is admin
        createdAt: new Date().toISOString(),
      };

      // Create default user profile
      const newProfile: UserProfile = {
        userId: newUser.id,
        displayName: displayName.trim(),
        availableTimeslots: [],
        scenes: [],
        contactInfo: '',
        notes: '',
        updatedAt: new Date().toISOString(),
      };

      // Save user and profile
      const updatedUsers = [...existingUsers, newUser];
      await StorageService.saveUsers(updatedUsers);
      await StorageService.saveUserProfile(newUser.id, newProfile);

      // Auto-login the new user
      setCurrentUser(newUser);
      setUserProfile(newProfile);
      await StorageService.saveCurrentUser(newUser);
      
      await refreshUsers();
      return true;
    } catch (error) {
      console.error('Error adding new user:', error);
      return false;
    }
  };

  const updateUserProfile = async (profileUpdates: Partial<UserProfile>) => {
    try {
      if (!currentUser || !userProfile) return;

      const updatedProfile: UserProfile = {
        ...userProfile,
        ...profileUpdates,
        updatedAt: new Date().toISOString(),
      };

      await StorageService.saveUserProfile(currentUser.id, updatedProfile);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  const value = {
    currentUser,
    userProfile,
    users,
    isLoading,
    login,
    logout,
    addNewUser,
    updateUserProfile,
    refreshUsers,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
