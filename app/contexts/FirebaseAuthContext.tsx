import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInAnonymously,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';

interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
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
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithUsername: (username: string) => Promise<boolean>; // Keep for backwards compatibility
  logout: () => Promise<void>;
  signUp: (email: string, password: string, username: string, displayName: string) => Promise<boolean>;
  addNewUser: (username: string, displayName: string) => Promise<boolean>; // Keep for backwards compatibility
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setCurrentUser({ ...userData, id: firebaseUser.uid });
            
            // Load user profile
            const profileDoc = await getDoc(doc(db, 'userProfiles', firebaseUser.uid));
            if (profileDoc.exists()) {
              setUserProfile(profileDoc.data() as UserProfile);
            }
          } else {
            // Create user document if it doesn't exist (for anonymous users)
            const newUser: User = {
              id: firebaseUser.uid,
              username: `user_${firebaseUser.uid.slice(0, 8)}`,
              displayName: firebaseUser.displayName || 'Anonymous User',
              email: firebaseUser.email || undefined,
              isAdmin: false,
              createdAt: new Date().toISOString(),
            };
            
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setCurrentUser(newUser);
            
            // Create default profile
            const defaultProfile: UserProfile = {
              userId: firebaseUser.uid,
              displayName: newUser.displayName,
              availableTimeslots: [],
              scenes: [],
              contactInfo: '',
              notes: '',
              updatedAt: new Date().toISOString(),
            };
            
            await setDoc(doc(db, 'userProfiles', firebaseUser.uid), defaultProfile);
            setUserProfile(defaultProfile);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Backwards compatibility - convert username to anonymous login
  const loginWithUsername = async (username: string): Promise<boolean> => {
    try {
      // For backwards compatibility, create anonymous users
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;
      
      const newUser: User = {
        id: firebaseUser.uid,
        username: username,
        displayName: username.charAt(0).toUpperCase() + username.slice(1),
        isAdmin: username.toLowerCase() === 'admin',
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      // Create default profile
      const defaultProfile: UserProfile = {
        userId: firebaseUser.uid,
        displayName: newUser.displayName,
        availableTimeslots: [],
        scenes: [],
        contactInfo: '',
        notes: '',
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'userProfiles', firebaseUser.uid), defaultProfile);
      
      return true;
    } catch (error) {
      console.error('Username login error:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, username: string, displayName: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const newUser: User = {
        id: firebaseUser.uid,
        username,
        displayName,
        email,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      
      // Create default profile
      const defaultProfile: UserProfile = {
        userId: firebaseUser.uid,
        displayName,
        availableTimeslots: [],
        scenes: [],
        contactInfo: '',
        notes: '',
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'userProfiles', firebaseUser.uid), defaultProfile);
      
      return true;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    }
  };

  // Backwards compatibility
  const addNewUser = async (username: string, displayName: string): Promise<boolean> => {
    return await loginWithUsername(username);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
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

      await updateDoc(doc(db, 'userProfiles', currentUser.id), updatedProfile);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  const value = {
    currentUser,
    userProfile,
    isLoading,
    login,
    loginWithUsername,
    logout,
    signUp,
    addNewUser,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
